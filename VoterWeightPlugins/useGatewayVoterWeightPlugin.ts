import { GATEWAY_PLUGINS_PKS } from '@constants/plugins'
import { useRealmVoterWeightPlugins } from '@hooks/useRealmVoterWeightPlugins'

import { useVoterWeightPluginReadinessReturnType } from './lib/types'
import { PublicKey } from '@solana/web3.js'

export interface useGatewayVoterWeightPluginReturnType
  extends useVoterWeightPluginReadinessReturnType {
  gatekeeperNetwork: PublicKey | null
}

type GatewayPluginParams = {
  gatekeeperNetwork: PublicKey | null
}

export const useGatewayVoterWeightPlugin = (): useGatewayVoterWeightPluginReturnType => {
  const { isReady, plugins } = useRealmVoterWeightPlugins()

  const gatewayPlugin = plugins?.find((plugin) =>
    GATEWAY_PLUGINS_PKS.includes(plugin.programId.toString())
  )

  const isEnabled = gatewayPlugin !== undefined
  const gatekeeperNetwork = (
    (gatewayPlugin?.params as GatewayPluginParams) || undefined
  )?.gatekeeperNetwork

  return {
    isReady,
    gatekeeperNetwork,
    isEnabled,
    plugin: gatewayPlugin,
  }
}
