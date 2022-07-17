import React, { useContext, useEffect, useState } from 'react'
import * as yup from 'yup'
import {
  Governance,
  ProgramAccount,
  serializeInstructionToBase64,
  SYSTEM_PROGRAM_ID,
} from '@solana/spl-governance'
import { validateInstruction } from '@utils/instructionTools'
import { UiInstruction } from '@utils/uiTypes/proposalCreationTypes'

import useWalletStore from 'stores/useWalletStore'
import useRealm from '@hooks/useRealm'
import useVotePluginsClientStore from 'stores/useVotePluginsClientStore'
import { NewProposalContext } from '../../../new'
import InstructionForm, {
  InstructionInput,
  InstructionInputType,
} from '../FormCreator'
import { AssetAccount } from '@utils/uiTypes/assets'
import useGovernanceAssets from '@hooks/useGovernanceAssets'
import { PublicKey } from '@solana/web3.js'
import { InformationCircleIcon } from '@heroicons/react/outline'
import Tooltip from '@components/Tooltip'
import { getRegistrarPDA } from '@utils/plugin/accounts'

interface CreateQuadraticRegistrarForm {
  governedAccount: AssetAccount | undefined
  predecessor: string | undefined // if part of a chain of plugins
}

const CreateQuadraticPluginRegistrar = ({
  index,
  governance,
}: {
  index: number
  governance: ProgramAccount<Governance> | null
}) => {
  const { realm, realmInfo } = useRealm()
  const quadraticClient = useVotePluginsClientStore(
    (s) => s.state.quadraticClient
  )
  const { assetAccounts } = useGovernanceAssets()
  const wallet = useWalletStore((s) => s.current)
  const shouldBeGoverned = index !== 0 && governance
  const [form, setForm] = useState<CreateQuadraticRegistrarForm>()
  const [formErrors, setFormErrors] = useState({})
  const { handleSetInstructions } = useContext(NewProposalContext)

  async function getInstruction(): Promise<UiInstruction> {
    const isValid = await validateInstruction({ schema, form, setFormErrors })
    let serializedInstruction = ''
    if (
      isValid &&
      form!.governedAccount?.governance?.account &&
      wallet?.publicKey
    ) {
      const { registrar } = await getRegistrarPDA(
        realm!.pubkey,
        realm!.account.communityMint,
        quadraticClient!.program.programId
      )

      const remainingAccounts = form!.predecessor
        ? [
            {
              pubkey: new PublicKey(form!.predecessor),
              isSigner: false,
              isWritable: false,
            },
          ]
        : []

      const createRegistrarIx = await quadraticClient!.program.methods
        .createRegistrar(false)
        .accounts({
          registrar,
          realm: realm!.pubkey,
          governanceProgramId: realmInfo!.programId,
          realmAuthority: realm!.account.authority!,
          governingTokenMint: realm!.account.communityMint!,
          payer: wallet.publicKey!,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .instruction()
      serializedInstruction = serializeInstructionToBase64(createRegistrarIx)
    }
    return {
      serializedInstruction: serializedInstruction,
      isValid,
      governance: form!.governedAccount?.governance,
      chunkSplitByDefault: true,
    }
  }
  useEffect(() => {
    handleSetInstructions(
      { governedAccount: form?.governedAccount?.governance, getInstruction },
      index
    )
  }, [form])
  const schema = yup.object().shape({
    governedAccount: yup
      .object()
      .nullable()
      .required('Governed account is required'),
  })
  const inputs: InstructionInput[] = [
    {
      label: 'Governance',
      initialValue: null,
      name: 'governedAccount',
      type: InstructionInputType.GOVERNED_ACCOUNT,
      shouldBeGoverned: shouldBeGoverned,
      governance: governance,
      options: assetAccounts.filter(
        (x) =>
          x.governance.pubkey.toBase58() ===
          realm?.account.authority?.toBase58()
      ),
    },
    {
      label: 'Predecessor plugin (optional)',
      initialValue: '',
      inputType: 'text',
      name: 'predecessor',
      type: InstructionInputType.INPUT,
      additionalComponent: (
        <Tooltip content="If the DAO is using more than one plugin, this is the program ID of the previous plugin in the chain.">
          <span>
            <InformationCircleIcon className="w-4 h-4 ml-1"></InformationCircleIcon>
          </span>
        </Tooltip>
      ),
    },
  ]

  return (
    <>
      <InstructionForm
        outerForm={form}
        setForm={setForm}
        inputs={inputs}
        setFormErrors={setFormErrors}
        formErrors={formErrors}
      ></InstructionForm>
    </>
  )
}

export default CreateQuadraticPluginRegistrar
