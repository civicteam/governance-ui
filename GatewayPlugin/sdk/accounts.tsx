import { PublicKey } from '@solana/web3.js'
import { ProgramAccount, Realm } from '@solana/spl-governance'
import { GatewayClient } from '@solana/governance-program-library'
import {
  getPreviousVotingWeightRecord,
  getRegistrarPDA,
  getVoterWeightRecord,
  PluginClient,
} from '@utils/plugin/accounts'
import { notify } from '@utils/notifications'

export const getGatekeeperNetwork = async (
  client: GatewayClient,
  realm: ProgramAccount<Realm>
): Promise<PublicKey> => {
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
  return registrarObject.gatekeeperNetwork
}

export const getVoteInstruction = async (
  client: GatewayClient,
  gatewayToken: PublicKey,
  realm: ProgramAccount<Realm>,
  walletPk: PublicKey
) => {
  // Throw if the user has no gateway token
  if (!gatewayToken) {
    const error = new Error(
      `Unable to execute transaction: No Civic Pass found`
    )
    notify({ type: 'error', message: `${error}` })
    throw error
  }

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
    // TODO this clumsy cast should not be necessary
    // The parameterisation of the common properties of the IDL used
    // in each plugin is not working correctly at the moment.
    (client as unknown) as PluginClient,
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
      gatewayToken,
    })
    .instruction()
}
