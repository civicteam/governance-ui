import { usePlugins, usePluginsArgs } from './usePlugins'
import { useVotingPluginReturnType } from './useQuadraticVotingPlugin'

export interface useGatewayVotingPluginReturnType
  extends useVotingPluginReturnType {
  gatewayNetwork: string
}

export const useGatewayVotingPlugin = ({
  realmPublicKey,
  governanceMintPublicKey,
  walletPublicKey,
}: usePluginsArgs): useGatewayVotingPluginReturnType => {
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

  const gatekeeperNetwork = getPluginData('gateway').gatekeeperNetwork

  return {
    isReady,
    gatekeeperNetwork,
    isEnabled: isPluginEnabled(PluginName.GATEWAY),
    pluginData: getPluginData('quadraticVoting'),
  }
}
