import { BN } from '@project-serum/anchor'
import { MaxVoterWeightRecord, ProgramAccount } from '@solana/spl-governance'
import create, { State } from 'zustand'

interface QuadraticPluginStore extends State {
  state: {
    votingPower: BN
    maxVoteRecord: ProgramAccount<MaxVoterWeightRecord> | null
  }
  setVotingPower: () => void
  setMaxVoterWeight: (
    maxVoterRecord: ProgramAccount<MaxVoterWeightRecord> | null
  ) => void
}

const defaultState = {
  votingPower: new BN(0),
  maxVoteRecord: null,
}

const useQuadraticPluginStore = create<QuadraticPluginStore>((set, _get) => ({
  state: {
    ...defaultState,
  },
  setVotingPower: () => {
    set((s) => {
      s.state.votingPower = new BN(1)
    })
  },
  setMaxVoterWeight: (maxVoterRecord) => {
    set((s) => {
      s.state.maxVoteRecord = maxVoterRecord
    })
  },
}))

export default useQuadraticPluginStore
