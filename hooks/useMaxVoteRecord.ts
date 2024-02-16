import { useMemo } from 'react'
import { MaxVoterWeightRecord, ProgramAccount } from '@solana/spl-governance'
import useNftPluginStore from 'NftVotePlugin/store/nftPluginStore'
import useHeliumVsrStore from 'HeliumVotePlugin/hooks/useHeliumVsrStore'

// TODO QV-2: This hook should be removed and the record will come from the new hook
/** @deprecated this should be replaced by the useRealmVoterWeightPlugins */
export const useMaxVoteRecord = () => {
  const nftMaxVoteRecord = useNftPluginStore((s) => s.state.maxVoteRecord)
  const heliumMaxVoteRecord = useHeliumVsrStore((s) => s.state.maxVoteRecord)
  const maxVoteWeightRecord: ProgramAccount<MaxVoterWeightRecord> | null = useMemo(
    () => nftMaxVoteRecord || heliumMaxVoteRecord || null,
    [nftMaxVoteRecord, heliumMaxVoteRecord]
  )

  return maxVoteWeightRecord
}
