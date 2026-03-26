import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WalletState } from "../backend.d";
import { useActor } from "./useActor";

export function useWalletState() {
  const { actor, isFetching } = useActor();
  return useQuery<WalletState>({
    queryKey: ["walletState"],
    queryFn: async () => {
      if (!actor) return { balance: 0n, cofrinhoBalance: 0n, transactions: [] };
      return actor.getWalletState();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendPix() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pixKey,
      amount,
      description,
    }: { pixKey: string; amount: bigint; description: string }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.sendPix(pixKey, amount, description);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["walletState"] }),
  });
}

export function useSimulateReceivePix() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      senderName,
    }: { amount: bigint; senderName: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.simulateReceivePix(amount, senderName);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["walletState"] }),
  });
}

export function useDepositCofrinho() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.depositCofrinho(amount);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["walletState"] }),
  });
}

export function useWithdrawCofrinho() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.withdrawCofrinho(amount);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["walletState"] }),
  });
}
