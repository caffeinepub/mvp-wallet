import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WalletState {
    cofrinhoBalance: bigint;
    balance: bigint;
    transactions: Array<Transaction>;
}
export interface UserProfile {
    name: string;
}
export interface Transaction {
    id: string;
    transactionType: TransactionType;
    description: string;
    pixKey: string;
    timestamp: bigint;
    balanceAfter: bigint;
    amount: bigint;
}
export enum TransactionType {
    receivedPix = "receivedPix",
    cofrinhoDeposit = "cofrinhoDeposit",
    cofrinhoWithdrawal = "cofrinhoWithdrawal",
    sentPix = "sentPix"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    depositCofrinho(amount: bigint): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWalletState(): Promise<WalletState>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendPix(pixKey: string, amount: bigint, description: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    simulateReceivePix(amount: bigint, senderName: string): Promise<bigint>;
    withdrawCofrinho(amount: bigint): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
