import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Spin from '@/components/ui/Spin';
import { useInterval } from 'usehooks-ts';

const INTERVAL_TIME = 15000; // TODO: see if this value is fine

export type TGasEstimate = {
  confidence: number;
  price: number;
  maxPriorityFeePerGas: number;
  maxFeePerGas: number; // Max fee per gas in gwei
};

interface IGasEstimationProps {
  onGasChange: (estimate: TGasEstimate) => void;
}

const GasEstimation = ({ onGasChange }: IGasEstimationProps) => {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currGasEstimation, setSelectedEstimate] = useState<TGasEstimate | null>(null);

  useEffect(() => {
    fetchGasEstimates();
  }, []);

  const fetchGasEstimates = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://api.blocknative.com/gasprices/blockprices');

      const estimate = response.data.blockPrices[0].estimatedPrices?.[0];
      setSelectedEstimate(estimate);
      onGasChange(estimate);
    } catch (error) {
      console.error('Error fetching gas estimates:', error);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useInterval(() => {
    fetchGasEstimates();
  }, INTERVAL_TIME);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-bold">Gas Estimation</CardTitle>
        <Badge variant="outline" className="ml-2">
          {loading ? (
            <Spin size="sm" isLoading inline className="mr-2" />
          ) : (
            `Last updated: ${lastUpdated?.toLocaleTimeString() || 'N/A'}`
          )}
        </Badge>
      </CardHeader>
      <CardContent>
        {currGasEstimation && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Price (Gwei)</TableHead>
                <TableHead>Max Priority Fee</TableHead>
                <TableHead>Max Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{currGasEstimation.price}</TableCell>
                <TableCell>{currGasEstimation.maxPriorityFeePerGas}</TableCell>
                <TableCell>{currGasEstimation.maxFeePerGas}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default GasEstimation;
