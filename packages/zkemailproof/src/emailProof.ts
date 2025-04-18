import { readFileSync, existsSync, mkdirSync, rm, writeFileSync } from 'fs';
import { join } from 'path';
import { generateEmailVerifierInputs } from '@zk-email/helpers';
import { Groth16Proof, PublicSignals, groth16 } from 'snarkjs';
import { execPromise } from './exec.js';
import { GenerateWitness } from './generateWitness.js';
import { Hex } from './hex.js';

export type IEmailApproverCircuitInputs = {
  email_header: string[];
  email_header_length: string;
  pubkey: string[];
  signature: string[];
  sender_email_idx: string;
  sender_email_commitment_rand: string;
  sender_domain_idx: string;
  subject_idx: string;
};

export interface IEmailProof {
  proof: string[];
  pubkeyHash: string;
  senderDomainHash: string;
  senderCommitment: string;
  controlAddress: string;
  approvedHash: string;
}

export class EmailProof {
  private _file_wasm: string;
  private _file_zkey: string;
  private vKey;
  private _rapidsnarkProverBin: string | undefined;
  private _tmpDir: string;
  private _GenerateWitness: GenerateWitness;

  /**
   * Creates an instance of EmailProof.
   * @param {string} file_wasm the path to the file EmailApprover.wasm
   * @param {string} file_zkey the path to the file emailapprover_final.zkey
   * @param {string} file_vkey the path to the file verification_key.json
   * @param {string} [rapidsnarkProverBin] the path to the file `rapidsnark-xxx-v0.0.2/bin/prover`, if set, will use rapidsnark to generate proof. download from `https://github.com/iden3/rapidsnark/releases/`
   * @memberof EmailProof
   */
  constructor(
    file_wasm: string,
    file_zkey: string,
    file_vkey: string,
    rapidsnarkProverBin?: string,
    tmpDir?: string
  ) {
    this.vKey = JSON.parse(readFileSync(file_vkey).toString('utf-8'));
    // check if file_wasm and file_zkey exist
    if (!file_wasm || !file_zkey) {
      throw new Error('The file_wasm and file_zkey are required');
    }
    if (!file_wasm.endsWith('.wasm') || !file_zkey.endsWith('.zkey')) {
      throw new Error(
        'The file_wasm must be a .wasm file and the file_zkey must be a .zkey file'
      );
    }
    if (!existsSync(file_wasm) || !existsSync(file_zkey)) {
      throw new Error('The file_wasm and file_zkey must exist');
    }
    if (rapidsnarkProverBin !== undefined && existsSync(rapidsnarkProverBin)) {
      this._rapidsnarkProverBin = rapidsnarkProverBin;
      console.log('Using rapidsnark to generate proof');
    } else {
      this._rapidsnarkProverBin = undefined;
      console.log('Using snarkjs to generate proof');
    }

    this._file_wasm = file_wasm;
    this._file_zkey = file_zkey;

    if (tmpDir === undefined) {
      this._tmpDir = join(__dirname, '.tmp');
    } else {
      this._tmpDir = tmpDir;
    }
    if (!existsSync(this._tmpDir)) {
      mkdirSync(this._tmpDir);
    }

    this._GenerateWitness = new GenerateWitness(this._tmpDir);
  }

  /**
   * generate proof from eml file path or eml content
   *
   * @param {string} emlFilePathOrEmlContent
   * @param {bigint} senderCommitmentRand
   * @return {*}  {(Promise<IEmailProof | null>)}
   * @memberof EmailProof
   */
  public async proveFromEml(
    emlFilePathOrEmlContent: string,
    senderCommitmentRand: bigint
  ): Promise<IEmailProof | null> {
    // check if the input is a file path or the content of the eml file
    let rawEmail: string;
    if (
      emlFilePathOrEmlContent.length < 1000 &&
      emlFilePathOrEmlContent.endsWith('.eml')
    ) {
      rawEmail = readFileSync(emlFilePathOrEmlContent, 'utf8');
    } else {
      rawEmail = emlFilePathOrEmlContent;
    }
    const _rawEml = rawEmail.toLowerCase();
    if (!_rawEml.includes('dkim-signature:') || !_rawEml.includes('subject:')) {
      throw new Error('The email content is not valid:' + rawEmail);
    }

    const inputs = await generateEmailVerifierInputs(rawEmail);
    const emailHeader = Buffer.from(inputs.emailHeader.map((c) => Number(c)));
    const subjectPrefixBuffer = Buffer.from('subject:');
    const subjectIndex =
      emailHeader.indexOf(subjectPrefixBuffer) + subjectPrefixBuffer.length;
    const headerSelectorBuffer = Buffer.from('\r\nfrom:');
    const senderEmailNameEmailIndex =
      emailHeader.indexOf(headerSelectorBuffer) + headerSelectorBuffer.length;
    const senderEmailIndex =
      emailHeader
        .subarray(senderEmailNameEmailIndex)
        .indexOf(Buffer.from('<')) +
      senderEmailNameEmailIndex +
      1;
    const senderDomainIndex =
      emailHeader.subarray(senderEmailIndex).indexOf(Buffer.from('@')) + 1;

    const circuitinput: IEmailApproverCircuitInputs = {
      email_header: inputs.emailHeader,
      email_header_length: inputs.emailHeaderLength,
      pubkey: inputs.pubkey,
      signature: inputs.signature,
      sender_email_idx: senderEmailIndex.toString(),
      sender_email_commitment_rand: senderCommitmentRand.toString(),
      sender_domain_idx: senderDomainIndex.toString(),
      subject_idx: subjectIndex.toString(),
    };

    return this.proveFromCircuitinput(circuitinput);
  }

  /**
   * generate proof from circuit input
   *
   * @param {IEmailApproverCircuitInputs} circuitinput
   * @return {*}  {(Promise<IEmailProof | null>)}
   * @memberof EmailProof
   */
  public async proveFromCircuitinput(
    circuitinput: IEmailApproverCircuitInputs
  ): Promise<IEmailProof | null> {
    try {
      const proveData = await this._fullProve(
        circuitinput,
        this._file_wasm,
        this._file_zkey
      );
      if (proveData === null) {
        return null;
      }
      const { proof, publicSignals } = proveData;

      const res = await groth16.verify(this.vKey, publicSignals, proof);
      if (res === true) {
        // get contract inputs
        const _controlAddress = BigInt(publicSignals[3]).toString(16);
        const _approvedHash = (
          (BigInt(publicSignals[4]) << BigInt(128)) +
          BigInt(publicSignals[5])
        ).toString(16);
        return {
          proof: [
            Hex.paddingZero(BigInt(proof.pi_a[0]), 32),
            Hex.paddingZero(BigInt(proof.pi_a[1]), 32),
            Hex.paddingZero(BigInt(proof.pi_b[0][1]), 32),
            Hex.paddingZero(BigInt(proof.pi_b[0][0]), 32),
            Hex.paddingZero(BigInt(proof.pi_b[1][1]), 32),
            Hex.paddingZero(BigInt(proof.pi_b[1][0]), 32),
            Hex.paddingZero(BigInt(proof.pi_c[0]), 32),
            Hex.paddingZero(BigInt(proof.pi_c[1]), 32),
          ],
          pubkeyHash: Hex.paddingZero(BigInt(publicSignals[0]), 32),
          senderDomainHash: Hex.paddingZero(BigInt(publicSignals[1]), 32),
          senderCommitment: Hex.paddingZero(BigInt(publicSignals[2]), 32),
          controlAddress:
            '0x' + '0'.repeat(40 - _controlAddress.length) + _controlAddress,
          approvedHash:
            '0x' + '0'.repeat(64 - _approvedHash.length) + _approvedHash,
        };
      } else {
        console.log('Invalid proof');
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private _randomSeed = 0;
  private _randomString(): string {
    return (
      this._randomSeed++ +
      '' +
      new Date().getTime() +
      '' +
      Math.floor(Math.random() * 100000)
    );
  }

  private async _fullProve(
    circuitinput: IEmailApproverCircuitInputs,
    wasmFile: string,
    zkeyFile: string
  ): Promise<{
    proof: Groth16Proof;
    publicSignals: PublicSignals;
  } | null> {
    // get random string
    const randomString = this._randomString();
    const tmpDir = join(this._tmpDir, randomString);
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir);
    }

    // write the circuit input to file
    const circuitInputFile = join(tmpDir, `circuit_input.json`);
    writeFileSync(circuitInputFile, JSON.stringify(circuitinput));

    // generate `witness.wtns`, node generate_witness.js EmailApprover.wasm input.json witness.wtns
    const witnessFile = join(tmpDir, `witness.wtns`);

    await this._GenerateWitness.generateWitnessFile(
      wasmFile,
      circuitInputFile,
      witnessFile
    );
    if (!existsSync(witnessFile)) {
      console.error('Failed to generate witness file');
      return null;
    }

    try {
      if (this._rapidsnarkProverBin !== undefined) {
        const proofFile = join(tmpDir, `proof.json`);
        const publicFile = join(tmpDir, `public.json`);
        await execPromise(
          `${this._rapidsnarkProverBin} ${zkeyFile} ${witnessFile} ${proofFile} ${publicFile}`
        );

        if (!existsSync(proofFile) || !existsSync(publicFile)) {
          console.error('Failed to generate proof');
          return null;
        }

        const _proof: unknown = JSON.parse(
          readFileSync(proofFile).toString('utf-8')
        );
        const _publicSignals: string[] = JSON.parse(
          readFileSync(publicFile).toString('utf-8')
        );

        if (_publicSignals.length !== 6) {
          console.error('Invalid public signals');
          return null;
        }

        const proof: Groth16Proof = _proof as Groth16Proof;
        const publicSignals: PublicSignals = _publicSignals as PublicSignals;

        return {
          proof,
          publicSignals,
        };
      } else {
        return await groth16.prove(zkeyFile, witnessFile);
      }
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      // remove the tmp directory
      rm(tmpDir, { recursive: true }, () => {});
    }
  }
}
