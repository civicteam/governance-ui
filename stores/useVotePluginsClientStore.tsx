import create, { State } from 'zustand'
import {
  NftVoterClient,
  GatewayClient,
} from '@solana/governance-program-library'
import { SwitchboardQueueVoterClient } from '../SwitchboardVotePlugin/SwitchboardQueueVoterClient'
import { getRegistrarPDA, Registrar } from 'VoteStakeRegistry/sdk/accounts'
import { getRegistrarPDA as getPluginRegistrarPDA } from '@utils/plugin/accounts'
import { AnchorProvider, Wallet } from '@project-serum/anchor'
import { tryGetNftRegistrar, tryGetRegistrar } from 'VoteStakeRegistry/sdk/api'
import { SignerWalletAdapter } from '@solana/wallet-adapter-base'
import { ConnectionContext } from '@utils/connection'
import { ProgramAccount, Realm } from '@solana/spl-governance'
import { VotingClient, VotingClientProps } from '@utils/uiTypes/VotePlugin'
import { PythClient } from 'pyth-staking-api'
import { PublicKey } from '@solana/web3.js'
import { tryGetGatewayRegistrar } from '../GatewayPlugin/sdk/api'
import { VsrClient } from 'VoteStakeRegistry/sdk/client'
import { QuadraticClient } from '../QuadraticPlugin/sdk/accounts'
import { tryGetQuadraticRegistrar } from '../QuadraticPlugin/sdk/api'

interface UseVotePluginsClientStore extends State {
  state: {
    //different plugins to choose because we will still have functions related only to one plugin
    vsrClient: VsrClient | undefined
    nftClient: NftVoterClient | undefined
    gatewayClient: GatewayClient | undefined
    quadraticClient: QuadraticClient | undefined
    switchboardClient: SwitchboardQueueVoterClient | undefined
    pythClient: PythClient | undefined
    voteStakeRegistryRegistrar: Registrar | null
    nftMintRegistrar: any
    gatewayRegistrar: any
    quadraticRegistrar: any
    currentRealmVotingClient: VotingClient
    voteStakeRegistryRegistrarPk: PublicKey | null
    maxVoterWeight: PublicKey | undefined
  }
  handleSetVsrClient: (
    wallet: SignerWalletAdapter | undefined,
    connection: ConnectionContext,
    programId?: PublicKey
  ) => void
  handleSetNftClient: (
    wallet: SignerWalletAdapter | undefined,
    connection: ConnectionContext
  ) => void
  handleSetSwitchboardClient: (
    wallet: SignerWalletAdapter | undefined,
    connection: ConnectionContext
  ) => void
  handleSetGatewayClient: (
    wallet: SignerWalletAdapter | undefined,
    connection: ConnectionContext
  ) => void
  handleSetQuadraticClient: (
    wallet: SignerWalletAdapter | undefined,
    connection: ConnectionContext
  ) => void
  handleSetPythClient: (
    wallet: SignerWalletAdapter | undefined,
    connection: ConnectionContext
  ) => void
  handleSetVsrRegistrar: (
    client: VsrClient,
    realm: ProgramAccount<Realm> | undefined
  ) => void
  handleSetNftRegistrar: (
    client: NftVoterClient,
    realm: ProgramAccount<Realm> | undefined
  ) => void
  handleSetGatewayRegistrar: (
    client: GatewayClient,
    realm: ProgramAccount<Realm> | undefined
  ) => void
  handleSetQuadraticRegistrar: (
    client: QuadraticClient,
    realm: ProgramAccount<Realm> | undefined
  ) => void
  handleSetCurrentRealmVotingClient: ({
    client,
    realm,
    walletPk,
    predecessorClient,
  }: VotingClientProps) => void
}

const defaultState = {
  vsrClient: undefined,
  nftClient: undefined,
  gatewayClient: undefined,
  quadraticClient: undefined,
  switchboardClient: undefined,
  pythClient: undefined,
  voteStakeRegistryRegistrar: null,
  voteStakeRegistryRegistrarPk: null,
  nftMintRegistrar: null,
  gatewayRegistrar: null,
  quadraticRegistrar: null,
  currentRealmVotingClient: new VotingClient({
    client: undefined,
    realm: undefined,
    walletPk: undefined,
  }),
  maxVoterWeight: undefined,
}

const useVotePluginsClientStore = create<UseVotePluginsClientStore>(
  (set, _get) => ({
    state: {
      ...defaultState,
    },
    handleSetVsrClient: async (wallet, connection, programId) => {
      const options = AnchorProvider.defaultOptions()
      const provider = new AnchorProvider(
        connection.current,
        (wallet as unknown) as Wallet,
        options
      )
      const vsrClient = await VsrClient.connect(
        provider,
        programId,
        connection.cluster === 'devnet'
      )
      set((s) => {
        s.state.vsrClient = vsrClient
      })
    },
    handleSetVsrRegistrar: async (client, realm) => {
      const clientProgramId = client!.program.programId
      const { registrar } = await getRegistrarPDA(
        realm!.pubkey,
        realm!.account.communityMint,
        clientProgramId
      )
      const existingRegistrar = await tryGetRegistrar(registrar, client!)
      set((s) => {
        s.state.voteStakeRegistryRegistrar = existingRegistrar
        s.state.voteStakeRegistryRegistrarPk = registrar
      })
    },
    handleSetNftClient: async (wallet, connection) => {
      const options = AnchorProvider.defaultOptions()
      const provider = new AnchorProvider(
        connection.current,
        (wallet as unknown) as Wallet,
        options
      )
      const nftClient = await NftVoterClient.connect(
        provider,
        connection.cluster === 'devnet'
      )
      set((s) => {
        s.state.nftClient = nftClient
      })
    },
    handleSetNftRegistrar: async (client, realm) => {
      const clientProgramId = client!.program.programId
      const { registrar } = await getPluginRegistrarPDA(
        realm!.pubkey,
        realm!.account.communityMint,
        clientProgramId
      )
      const existingRegistrar = await tryGetNftRegistrar(registrar, client!)
      set((s) => {
        s.state.nftMintRegistrar = existingRegistrar
      })
    },
    handleSetGatewayRegistrar: async (client, realm) => {
      const clientProgramId = client!.program.programId
      const { registrar } = await getPluginRegistrarPDA(
        realm!.pubkey,
        realm!.account.communityMint,
        clientProgramId
      )
      const existingRegistrar = await tryGetGatewayRegistrar(registrar, client!)
      set((s) => {
        s.state.gatewayRegistrar = existingRegistrar
      })
    },
    handleSetQuadraticRegistrar: async (client, realm) => {
      const clientProgramId = client!.program.programId
      const { registrar } = await getPluginRegistrarPDA(
        realm!.pubkey,
        realm!.account.communityMint,
        clientProgramId
      )
      const existingRegistrar = await tryGetQuadraticRegistrar(
        registrar,
        client!
      )
      set((s) => {
        s.state.quadraticRegistrar = existingRegistrar
      })
    },
    handleSetSwitchboardClient: async (wallet, connection) => {
      const options = AnchorProvider.defaultOptions()
      const provider = new AnchorProvider(
        connection.current,
        (wallet as unknown) as Wallet,
        options
      )
      const switchboardClient = await SwitchboardQueueVoterClient.connect(
        provider,
        connection.cluster === 'devnet'
      )
      set((s) => {
        s.state.switchboardClient = switchboardClient
      })
    },
    handleSetPythClient: async (wallet, connection) => {
      if (
        connection.cluster === 'localnet' ||
        connection.cluster === 'devnet'
      ) {
        const options = AnchorProvider.defaultOptions()
        const provider = new AnchorProvider(
          connection.current,
          (wallet as unknown) as Wallet,
          options
        )
        try {
          const pythClient = await PythClient.connect(
            provider,
            connection.cluster
          )

          const maxVoterWeight = (
            await pythClient.stakeConnection.program.methods
              .updateMaxVoterWeight()
              .pubkeys()
          ).maxVoterRecord

          set((s) => {
            s.state.pythClient = pythClient
            s.state.maxVoterWeight = maxVoterWeight
          })
        } catch (e) {
          console.error(e)
        }
      }
    },
    handleSetCurrentRealmVotingClient: ({
      client,
      realm,
      walletPk,
      predecessorClient,
    }) => {
      set((s) => {
        s.state.currentRealmVotingClient = new VotingClient({
          client,
          realm,
          walletPk,
          predecessorClient,
        })
      })
    },
    handleSetGatewayClient: async (wallet, connection) => {
      const options = AnchorProvider.defaultOptions()
      const provider = new AnchorProvider(
        connection.current,
        (wallet as unknown) as Wallet,
        options
      )
      const gatewayClient = await GatewayClient.connect(
        provider,
        connection.cluster === 'devnet'
      )
      set((s) => {
        s.state.gatewayClient = gatewayClient
      })
    },
    handleSetQuadraticClient: async (wallet, connection) => {
      const options = AnchorProvider.defaultOptions()
      const provider = new AnchorProvider(
        connection.current,
        (wallet as unknown) as Wallet,
        options
      )
      const quadraticClient = await QuadraticClient.connect(
        provider,
        connection.cluster === 'devnet'
      )
      set((s) => {
        s.state.quadraticClient = quadraticClient
      })
    },
  })
)

export default useVotePluginsClientStore
