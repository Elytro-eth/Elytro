import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import questionIcon from '@/assets/icons/question.svg';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { isAddress } from 'viem';
import { useAccount } from '../../contexts/account-context';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useElytroStep } from '@/components/steps/StepProvider';
import { TxData } from '.';

export default function RecipientStep() {
  const { currentChain } = useAccount();
  const { handleContinue } = useElytroStep();
  const formResolverConfig = z.object({
    address: z.string().refine((address) => isAddress(address), {
      message: 'Pleaase give a valid address.',
    }),
  });
  const form = useForm<z.infer<typeof formResolverConfig>>({
    resolver: zodResolver(formResolverConfig),
    mode: 'onChange',
  });
  const handleComfirm = () => {
    const { address } = form.getValues();
    handleContinue<TxData>({ to: address });
  };
  return (
    <div className="space-y-4">
      <h3 className="text-3xl">Recipient</h3>
      <div className="space-y-2">
        <Form {...form}>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <Label className="text-gray-400 font-normal">To</Label>
                <FormControl className="bg-gray-200 px-4 py-8 rounded-lg">
                  <Input
                    className="text-lg"
                    placeholder="Input address"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      </div>
      <div className="space-y-2">
        <Label className="text-gray-400 font-normal">Network</Label>
        <div className="flex flex-row items-center font-medium text-lg space-x-2">
          <div>{currentChain?.name}</div>
          <Tooltip>
            <TooltipTrigger>
              <img src={questionIcon} alt="question icon" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Network tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <Button
          onClick={handleComfirm}
          disabled={!form.formState.isValid}
          className={`w-full p-8 rounded-full ${form.formState.isValid ? 'bg-[#0E2D50]' : 'bg-[#F2F3F5] text-[#676B75]'}`}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
