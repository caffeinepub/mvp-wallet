import Map "mo:core/Map";
import Array "mo:core/Array";
import Int "mo:core/Int";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// Apply migration function for dropping stable variables

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type TransactionType = {
    #sentPix;
    #receivedPix;
    #cofrinhoDeposit;
    #cofrinhoWithdrawal;
  };

  type Transaction = {
    id : Text;
    transactionType : TransactionType;
    amount : Int;
    description : Text;
    pixKey : Text;
    timestamp : Int;
    balanceAfter : Int;
  };

  module Transaction {
    public func compare(t1 : Transaction, t2 : Transaction) : Order.Order {
      Text.compare(t1.id, t2.id);
    };
  };

  type WalletState = {
    balance : Int;
    cofrinhoBalance : Int;
    transactions : [Transaction];
  };

  type Wallet = {
    var balance : Int;
    var cofrinhoBalance : Int;
    transactions : List.List<Transaction>;
  };

  // User Profile type as required by the frontend
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  func getNewWallet() : Wallet {
    let wallet : Wallet = {
      var balance = 150_000;
      var cofrinhoBalance = 0;
      transactions = List.empty<Transaction>();
    };

    let initialTransactions : [Transaction] = [
      {
        id = "t1";
        transactionType = #receivedPix;
        amount = 250_000;
        description = "Salário";
        pixKey = "company@pix.com";
        timestamp = 1718198400 : Int;
        balanceAfter = 250_000;
      },
      {
        id = "t2";
        transactionType = #sentPix;
        amount = 50_000;
        description = "Rent";
        pixKey = "owner@pix.com";
        timestamp = 1718284800 : Int;
        balanceAfter = 200_000;
      },
      {
        id = "t3";
        transactionType = #cofrinhoDeposit;
        amount = 100_000;
        description = "Saving";
        pixKey = "";
        timestamp = 1718371200 : Int;
        balanceAfter = 100_000;
      },
      {
        id = "t4";
        transactionType = #cofrinhoWithdrawal;
        amount = 50_000;
        description = "Withdraw Cofrinho";
        pixKey = "";
        timestamp = 1718457600 : Int;
        balanceAfter = 150_000;
      },
      {
        id = "t5";
        transactionType = #receivedPix;
        amount = 250_000;
        description = "Payment";
        pixKey = "client@pix.com";
        timestamp = 1718544000 : Int;
        balanceAfter = 400_000;
      },
    ];

    wallet.transactions.addAll(initialTransactions.values());
    wallet;
  };

  func getTransactionHistory(transactionHistory : List.List<Transaction>) : [Transaction] {
    transactionHistory.toArray().sort();
  };

  let userWalletStore = Map.empty<Principal, Wallet>();

  func getCurrentTimestamp() : Int {
    Time.now();
  };

  func getUserWallet(caller : Principal) : Wallet {
    switch (userWalletStore.get(caller)) {
      case (?wallet) { wallet };
      case (null) {
        let newWallet = getNewWallet();
        userWalletStore.add(caller, newWallet);
        newWallet;
      };
    };
  };

  // Profile management functions required by the frontend
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Wallet functions - all require user authentication
  public query ({ caller }) func getWalletState() : async WalletState {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access wallet");
    };
    let wallet = getUserWallet(caller);
    {
      balance = wallet.balance;
      cofrinhoBalance = wallet.cofrinhoBalance;
      transactions = getTransactionHistory(wallet.transactions);
    };
  };

  public shared ({ caller }) func sendPix(pixKey : Text, amount : Int, description : Text) : async { #ok : Int; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send Pix");
    };

    if (amount <= 0) {
      return #err("Amount must be greater than zero.");
    };

    let wallet = getUserWallet(caller);
    if (wallet.balance < amount) {
      return #err("Insufficient balance.");
    };

    let newBalance = wallet.balance - amount;
    let newTransaction : Transaction = {
      id = "t" # Int.abs(wallet.transactions.size() + 1).toText();
      transactionType = #sentPix;
      amount;
      description;
      pixKey;
      timestamp = getCurrentTimestamp();
      balanceAfter = newBalance;
    };

    wallet.balance := newBalance;
    wallet.transactions.add(newTransaction);

    #ok(wallet.balance);
  };

  public shared ({ caller }) func simulateReceivePix(amount : Int, senderName : Text) : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can receive Pix");
    };

    if (amount <= 0) {
      Runtime.trap("Amount must be greater than zero.");
    };

    let wallet = getUserWallet(caller);
    let newBalance = wallet.balance + amount;
    let newTransaction : Transaction = {
      id = "t" # Int.abs(wallet.transactions.size() + 1).toText();
      transactionType = #receivedPix;
      amount;
      description = "Received from " # senderName;
      pixKey = senderName # "@pix.com";
      timestamp = getCurrentTimestamp();
      balanceAfter = newBalance;
    };

    wallet.balance := newBalance;
    wallet.transactions.add(newTransaction);

    wallet.balance;
  };

  public shared ({ caller }) func depositCofrinho(amount : Int) : async { #ok : Int; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can deposit to cofrinho");
    };

    if (amount <= 0) {
      return #err("Amount must be greater than zero.");
    };

    let wallet = getUserWallet(caller);
    if (wallet.balance < amount) {
      return #err("Insufficient balance for deposit.");
    };

    let newBalance = wallet.balance - amount;
    let newCofrinhoBalance = wallet.cofrinhoBalance + amount;
    let newTransaction : Transaction = {
      id = "t" # Int.abs(wallet.transactions.size() + 1).toText();
      transactionType = #cofrinhoDeposit;
      amount;
      description = "Deposit to cofrinho";
      pixKey = "";
      timestamp = getCurrentTimestamp();
      balanceAfter = newBalance;
    };

    wallet.balance := newBalance;
    wallet.cofrinhoBalance := newCofrinhoBalance;
    wallet.transactions.add(newTransaction);

    #ok(wallet.cofrinhoBalance);
  };

  public shared ({ caller }) func withdrawCofrinho(amount : Int) : async { #ok : Int; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can withdraw from cofrinho");
    };

    if (amount <= 0) {
      return #err("Amount must be greater than zero.");
    };

    let wallet = getUserWallet(caller);
    if (wallet.cofrinhoBalance < amount) {
      return #err("Insufficient balance in cofrinho.");
    };

    let newCofrinhoBalance = wallet.cofrinhoBalance - amount;
    let newBalance = wallet.balance + amount;
    let newTransaction : Transaction = {
      id = "t" # Int.abs(wallet.transactions.size() + 1).toText();
      transactionType = #cofrinhoWithdrawal;
      amount;
      description = "Withdrawal from cofrinho";
      pixKey = "";
      timestamp = getCurrentTimestamp();
      balanceAfter = newBalance;
    };

    wallet.cofrinhoBalance := newCofrinhoBalance;
    wallet.balance := newBalance;
    wallet.transactions.add(newTransaction);

    #ok(wallet.balance);
  };
};
