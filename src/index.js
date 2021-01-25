const {firstOrDefault, isEmptyArray} = require("./utils");
const knex = require("../knex/knex")
const crypto = require('crypto');
const {  ballots, multisig_memberships, delegates } = require("../knex/ldpos-table-schema");
const { areTablesEmpty }  = require("../knex/pg-helpers");
const { accountsRepo, ballotsRepo, multisigMembershipsRepo, transactionsRepo, delegatesRepo } = require("./repository")
const DEFAULT_NETWORK_SYMBOL = 'ldpos';

// todo - constructor and init can be refined
class DAL {

   constructor() {

   }

  async init(options) {
    await knex.migrate.latest();
    if (await areTablesEmpty()) {
      let {genesis} = options;
      let {accounts} = genesis;
      let multisigWalletList = genesis.multisigWallets || [];
      this.networkSymbol = genesis.networkSymbol || DEFAULT_NETWORK_SYMBOL;

      await Promise.all(
          accounts.map(async (accountInfo) => {
            let {votes, ...accountWithoutVotes} = accountInfo;
            let account = {
              ...accountWithoutVotes,
              updateHeight: 0
            };
            await this.upsertAccount(account);
            if (account.forgingPublicKey) {
              await this.upsertDelegate({
                address: account.address,
                voteWeight: '0'
              });
            }
          })
      );

      for (let accountInfo of accounts) {
        let {votes} = accountInfo;
        for (let delegateAddress of votes) {
          await this.vote({
            id: crypto.randomBytes(32).toString('base64'),
            voterAddress: accountInfo.address,
            delegateAddress
          });
          let delegate = await this.getDelegate(delegateAddress);
          let updatedVoteWeight = BigInt(delegate.voteWeight) + BigInt(accountInfo.balance);
          await this.upsertDelegate({
            address: delegateAddress,
            voteWeight: updatedVoteWeight.toString()
          });
        }
      }

      await Promise.all(
          multisigWalletList.map(async (multisigWallet) => {
            await this.registerMultisigWallet(
                multisigWallet.address,
                multisigWallet.members,
                multisigWallet.requiredSignatureCount
            );
          })
      );
    }
    return this;
  }

  async getNetworkSymbol() {
    return this.networkSymbol;
  }


  async upsertAccount(account) {
    await accountsRepo.upsert(account);
  }

  async getAccount(walletAddress) {
    const account = await accountsRepo.getByAddress(walletAddress);
    if (!account) {
      let error = new Error(`Account ${walletAddress} did not exist`);
      error.name = 'AccountDidNotExistError';
      error.type = 'InvalidActionError';
      throw error;
    }
    return { ...account };
  }

  async getAccountsByBalance(offset, limit, order) {

  }

  async getAccountVotes(voterAddress) {

  }

  async vote(ballot) {
    const { id, voterAddress, delegateAddress } = ballot;
    const idMatcher = { [ballots.columns.id] : id}
    if (await ballotsRepo.notExist(idMatcher)) {

      const activeVotesMatcher = {
        [ballots.columns.active]: true,
        [ballots.columns.type]: "vote",
        [ballots.columns.voterAddress]: voterAddress,
        [ballots.columns.delegateAddress]: delegateAddress,
      }
      const hasExistingVote = await ballotsRepo.exists(activeVotesMatcher);

      if (hasExistingVote) {
        let error = new Error(
            `Voter ${voterAddress} has already voted for delegate ${delegateAddress}`
        );
        error.name = 'VoterAlreadyVotedForDelegateError';
        error.type = 'InvalidActionError';
        throw error;
      }
      const activeUnvotesMatcher = {
        [ballots.columns.active]: true,
        [ballots.columns.type]: "unvote",
        [ballots.columns.voterAddress]: voterAddress,
        [ballots.columns.delegateAddress]: delegateAddress,
      }
      const newValue = { [ballots.columns.active] : false}
      await ballotsRepo.update(activeUnvotesMatcher, newValue);
    }
    ballot = { ...ballot,  type: 'vote', active: true}
    await ballotsRepo.upsert(ballot);
  }

  async unvote(ballot) {

  }

  async registerMultisigWallet(multisigAddress, memberAddresses, requiredSignatureCount) {
    const multisigAccount = await this.getAccount(multisigAddress);
    for (let memberAddress of memberAddresses) {
      let memberAccount = await this.getAccount(memberAddress);
      if (!memberAccount.multisigPublicKey) {
        let error = new Error(
            `Account ${memberAddress} was not registered for multisig so it cannot be a member of a multisig wallet`
        );
        error.name = 'MemberAccountWasNotRegisteredError';
        error.type = 'InvalidActionError';
        throw error;
      }
      if (memberAccount.type === 'multisig') {
        let error = new Error(
            `Account ${
                memberAddress
            } was a multisig wallet so it could not be registered as a member of another multisig wallet`
        );
        error.name = 'MemberAccountWasMultisigAccountError';
        error.type = 'InvalidActionError';
        throw error;
      }
    }

    multisigAccount.type = 'multisig';
    multisigAccount.requiredSignatureCount = requiredSignatureCount;
    await this.upsertAccount(multisigAccount);

    for (let memberAddress of memberAddresses) {
      const multiSigMembership = {
        [multisig_memberships.columns.multsigAccountAddress]: multisigAddress,
        [multisig_memberships.columns.memberAddress]: memberAddress
      }
      await multisigMembershipsRepo.insert(multiSigMembership);
    }
  }

  async getMultisigWalletMembers(multisigAddress) {
    let memberAddresses = await multisigMembershipsRepo.getMembersByMultsigAccountAddress(multisigAddress);
    if (isEmptyArray(memberAddresses)) {
      let error = new Error(
          `Address ${multisigAddress} is not registered as a multisig wallet`
      );
      error.name = 'MultisigAccountDidNotExistError';
      error.type = 'InvalidActionError';
      throw error;
    }
    return [...memberAddresses];
  }

  async getLastBlock() {
  }

  async getBlocksFromHeight(height, limit) {

  }

  async getSignedBlocksFromHeight(height, limit) {

  }

  async getLastBlockAtTimestamp(timestamp) {

  }

  async getBlocksBetweenHeights(fromHeight, toHeight, limit) {

  }

  async getBlockAtHeight(height) {

  }

  async getSignedBlockAtHeight(height) {

  }

  async getBlock(id) {

  }

  async getBlocksByTimestamp(offset, limit, order) {

  }

  async upsertBlock(block, synched) {

  }

  async getMaxBlockHeight() {

  }

  async hasTransaction(transactionId) {

  }

  async getTransaction(transactionId) {
    const transaction = await transactionsRepo.getById(transactionId)
    if (!transaction) {
      let error = new Error(`Transaction ${transactionId} did not exist`);
      error.name = 'TransactionDidNotExistError';
      error.type = 'InvalidActionError';
      throw error;
    }
    return {...transaction};
  }

  async getTransactionsByTimestamp(offset, limit, order) {

  }

  async getTransactionsFromBlock(blockId, offset, limit) {

  }

  async getInboundTransactions(walletAddress, fromTimestamp, limit, order) {

  }

  async getOutboundTransactions(walletAddress, fromTimestamp, limit, order) {

  }

  async getInboundTransactionsFromBlock(walletAddress, blockId) {

  }

  async getOutboundTransactionsFromBlock(walletAddress, blockId) {

  }

  async upsertDelegate(delegate) {
    await delegatesRepo.upsert(delegate);
  }

  async hasDelegate(walletAddress) {
    let addressMatcher = {[delegates.columns.address]: walletAddress};
    return await delegatesRepo.exists(addressMatcher);
  }

  async getDelegate(walletAddress) {
    const delegate = await delegatesRepo.getByAddress(walletAddress);
    if (!delegate) {
      let error = new Error(`Delegate ${walletAddress} did not exist`);
      error.name = 'DelegateDidNotExistError';
      error.type = 'InvalidActionError';
      throw error;
    }
    return {...delegate};
  }

  async getDelegatesByVoteWeight(offset, limit, order) {

  }

  simplifyBlock(signedBlock) {

  }
}

module.exports = DAL;


