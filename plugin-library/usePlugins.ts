import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import queryClient from '@hooks/queries/queryClient'
import { useConnection } from '@solana/wallet-adapter-react'
import { updateVoterWeightRecord } from './updateVoterWeightRecord'
import { PluginData, getPlugins } from './getPlugins'
import { useState, useEffect, useCallback } from 'react'

export interface usePluginsArgs {
  realmPublicKey: PublicKey | undefined
  governanceMintPublicKey: PublicKey | undefined
  walletPublicKey: PublicKey | undefined
}

export interface usePluginsReturnType {
  isReady: boolean
  plugins: Array<PluginData>
  updateVoterWeight: () => Promise<TransactionInstruction[]>
  createVoterWeightRecords: () => void
}

export const usePlugins = ({
  realmPublicKey,
  governanceMintPublicKey,
  walletPublicKey,
}: usePluginsArgs): usePluginsReturnType => {
  const { connection } = useConnection()
  const [plugins, setPlugins] = useState<Array<PluginData>>([])
  const [isReady, setIsReady] = useState(false)

  // const pluginProcessor: Record<PluginName, () => BN> = {
  //   gateway: () => GatewayProcessor.getVotingPower(),
  //   QV: () => QVProcessor.getVotingPower(),
  // }

  // setVotingPower(pluginProcessor[pluginName]())

  const fetchPlugins = useCallback(() => {
    if (!realmPublicKey || !governanceMintPublicKey || !walletPublicKey) {
      return Promise.resolve([])
    }

    return queryClient.fetchQuery({
      queryKey: ['fetchPlugins', realmPublicKey, governanceMintPublicKey],
      queryFn: () =>
        getPlugins({
          realmPublicKey,
          governanceMintPublicKey,
          walletPublicKey,
          connection,
        }),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realmPublicKey, governanceMintPublicKey, walletPublicKey])

  useEffect(() => {
    // TODO implement getting and setting voterWeight, maxVoterWeightRecord, voterWeightRecord
    // from the plugin info object
    const fetchAndSetPlugins = async () => {
      if (!realmPublicKey || !governanceMintPublicKey || !walletPublicKey) {
        return
      }
      const newPlugins = await fetchPlugins()
      setPlugins(newPlugins)
      setIsReady(true)
    }

    fetchAndSetPlugins()
  }, [realmPublicKey, governanceMintPublicKey, walletPublicKey, fetchPlugins])

  const createVoterWeightRecords = () => {
    return
  }

  const updateVoterWeight = (): Promise<TransactionInstruction[]> => {
    if (!realmPublicKey || !governanceMintPublicKey || !walletPublicKey) {
      return Promise.resolve([])
    }

    return queryClient.fetchQuery({
      queryKey: [
        'updateVoteWeight',
        realmPublicKey,
        walletPublicKey,
        governanceMintPublicKey,
      ],
      queryFn: () =>
        updateVoterWeightRecord({
          walletPublicKey,
          realmPublicKey,
          governanceMintPublicKey,
          connection,
        }),
    })
  }

  return {
    isReady,
    plugins,
    updateVoterWeight,
    createVoterWeightRecords,
  }
}
