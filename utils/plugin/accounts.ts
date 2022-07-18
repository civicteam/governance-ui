import { PublicKey } from '@solana/web3.js'
import {
  getTokenOwnerRecordAddress,
  ProgramAccount,
  Realm,
} from '@solana/spl-governance'
import { AccountClient, AccountNamespace, Idl } from '@project-serum/anchor'

export const getRegistrarPDA = async (
  realmPk: PublicKey,
  mint: PublicKey,
  clientProgramId: PublicKey
) => {
  const [registrar, registrarBump] = await PublicKey.findProgramAddress(
    [Buffer.from('registrar'), realmPk.toBuffer(), mint.toBuffer()],
    clientProgramId
  )
  return {
    registrar,
    registrarBump,
  }
}

export const getMaxVoterWeightRecord = async (
  realmPk: PublicKey,
  mint: PublicKey,
  clientProgramId: PublicKey
) => {
  const [
    maxVoterWeightRecord,
    maxVoterWeightRecordBump,
  ] = await PublicKey.findProgramAddress(
    [
      Buffer.from('max-voter-weight-record'),
      realmPk.toBuffer(),
      mint.toBuffer(),
    ],
    clientProgramId
  )
  return {
    maxVoterWeightRecord,
    maxVoterWeightRecordBump,
  }
}

export const getVoterWeightRecord = async (
  realmPk: PublicKey,
  mint: PublicKey,
  walletPk: PublicKey,
  clientProgramId: PublicKey
) => {
  const [
    voterWeightPk,
    voterWeightRecordBump,
  ] = await PublicKey.findProgramAddress(
    [
      Buffer.from('voter-weight-record'),
      realmPk.toBuffer(),
      mint.toBuffer(),
      walletPk.toBuffer(),
    ],
    clientProgramId
  )

  return {
    voterWeightPk,
    voterWeightRecordBump,
  }
}

export type MinimalPluginIdl = Idl & {
  accounts: [
    {
      name: 'registrar'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'governanceProgramId'
            type: 'publicKey'
          },
          {
            name: 'realm'
            type: 'publicKey'
          },
          {
            name: 'governingTokenMint'
            type: 'publicKey'
          },
          {
            name: 'previousVoterWeightPluginProgramId'
            type: {
              option: 'publicKey'
            }
          }
        ]
      }
    }
  ]
}

export type PluginClient<IDL extends MinimalPluginIdl = MinimalPluginIdl> = {
  program: {
    programId: PublicKey
    account: AccountNamespace<IDL> & { registrar: AccountClient<IDL> }
  }
}

export const getPredecessorProgramId = async (
  client: PluginClient,
  realm: ProgramAccount<Realm>
): Promise<PublicKey | null> => {
  // Get the registrar for the realm
  const { registrar } = await getRegistrarPDA(
    realm.pubkey,
    realm.account.communityMint,
    client.program.programId
  )
  const registrarObject = await client.program.account.registrar.fetch(
    registrar
  )

  // Find the gatekeeper network from the registrar
  return registrarObject.previousVoterWeightPluginProgramId as PublicKey | null
}

export const getPreviousVotingWeightRecord = async (
  client: PluginClient,
  realm: ProgramAccount<Realm>,
  walletPk: PublicKey
): Promise<PublicKey> => {
  // TODO cache this to avoid lookup every time someone votes
  const predecessorProgramId = await getPredecessorProgramId(client, realm)

  if (predecessorProgramId) {
    // this gateway plugin registrar has a predecessor plugin - get its voting weight record
    const { voterWeightPk } = await getVoterWeightRecord(
      realm.pubkey,
      realm.account.communityMint,
      walletPk,
      predecessorProgramId
    )
    return voterWeightPk
  }

  // this gateway plugin registrar has no predecessor plugin.
  // The previous voting weight record is the token owner record
  return getTokenOwnerRecordAddress(
    realm.owner,
    realm.pubkey,
    realm.account.communityMint,
    walletPk
  )
}
