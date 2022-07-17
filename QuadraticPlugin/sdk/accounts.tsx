import { PublicKey } from '@solana/web3.js'
import { ProgramAccount, Realm } from '@solana/spl-governance'
import {
  getPreviousVotingWeightRecord,
  getRegistrarPDA,
  getVoterWeightRecord,
} from '@utils/plugin/accounts'
import { IDL, Quadratic } from '../types'
import { Program, Provider } from '@project-serum/anchor'

const PROGRAM_ID = new PublicKey('quadCSapU8nTdLg73KHDnmdxKnJQsh7GUbu5tZfnRRr')

export class QuadraticClient {
  constructor(public program: Program<Quadratic>, public devnet?: boolean) {}

  static async connect(
    provider: Provider,
    devnet?: boolean
  ): Promise<QuadraticClient> {
    // alternatively we could fetch from chain
    // const idl = await Program.fetchIdl(PROGRAM_ID, provider);
    const idl = IDL

    return new QuadraticClient(
      new Program<Quadratic>(idl as Quadratic, PROGRAM_ID, provider),
      devnet
    )
  }
}

export const getVoteInstruction = async (
  client: QuadraticClient,
  realm: ProgramAccount<Realm>,
  walletPk: PublicKey
) => {
  // get the user's voter weight account address
  const { voterWeightPk } = await getVoterWeightRecord(
    realm.pubkey,
    realm.account.communityMint,
    walletPk,
    client.program.programId
  )

  // Get the registrar for the realm
  const { registrar } = await getRegistrarPDA(
    realm.pubkey,
    realm.account.communityMint,
    client.program.programId
  )

  // the previous voting weight record in the chain of plugins,
  // or the token owner record if this is the first plugin in the chain
  const inputVoterWeight = await getPreviousVotingWeightRecord(
    client,
    realm,
    walletPk
  )

  // call updateVotingWeightRecord on the plugin
  return client.program.methods
    .updateVoterWeightRecord()
    .accounts({
      registrar,
      voterWeightRecord: voterWeightPk,
      inputVoterWeight,
    })
    .instruction()
}
