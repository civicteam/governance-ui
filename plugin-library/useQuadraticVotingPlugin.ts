import { Coefficients } from 'QuadraticPlugin/sdk/api'
import { usePlugins, usePluginsArgs } from './usePlugins'
import { BN } from '@coral-xyz/anchor'
import { PluginData } from './getPlugins'

// TODO: move to getVotingPlugins when ready
export interface useVotingPluginReturnType {
  isReady: boolean //defines if the plugin is loading
  isEnabled: boolean //defines if the plugin is enabled in the realm
  pluginData: PluginData //defines the plugin data
}

export type useQuadraticVotingPluginReturnType = useVotingPluginReturnType

export const useQuadraticVotingPlugin = ({
  realmPublicKey,
  governanceMintPublicKey,
  walletPublicKey,
}: usePluginsArgs): useQuadraticVotingPluginReturnType => {
  const {
    isReady,
    setPluginDataParam,
    getPluginData,
    isPluginEnabled,
  } = usePlugins({
    realmPublicKey,
    governanceMintPublicKey,
    walletPublicKey,
  })

  // TODO define the voting power as the vanilla voting power with coefficients appliedx
  // const communityTOR = useAddressQuery_CommunityTokenOwner()
  // const councilTOR = useAddressQuery_CouncilTokenOwner()
  // const { data: TOR } = kind && kind === 'community' ? communityTOR : councilTOR
  // const qvVotingPower = applyCoefficients(await getVanillaGovpower(connection, TOR), DEFAULT_COEFFICIENTS)

  // note this is not bignumber-safe - TODO use a bigdecimal library to ensure the frontend values match the real ones
  const applyCoefficients = (x: BN, coefficients: Coefficients) => {
    const [a, b, c] = coefficients

    const number = x.toNumber()
    const rootX = Math.sqrt(x.toNumber())

    return new BN(Math.floor(a * rootX + b * number + c))
  }

  // const getVotingPower = () => getPluginData('quadraticVoting').votingPower

  // const setVotingPower = (communityTokenRecordPower: BN) => {
  //   const votingPower = applyCoefficients(
  //     communityTokenRecordPower,
  //     DEFAULT_COEFFICIENTS
  //   )

  //   setPluginDataParam('quadraticVoting', 'votingPower', votingPower)
  // }

  return {
    isReady,
    isEnabled: isPluginEnabled('quadraticVoting'),
    pluginData: getPluginData('quadraticVoting'),
  }
}
