import {CalculatedWeight, VoterWeightPluginInfo} from "./types";
import {reduceAsync} from "./utils";
import {PublicKey} from "@solana/web3.js";
import {ProgramAccount, TokenOwnerRecord} from "@solana/spl-governance";
import BN from "bn.js";
import {MintInfo} from "@solana/spl-token";

type CalculateVoterWeightParams = {
    walletPublicKey: PublicKey,
    realmPublicKey: PublicKey,
    governanceMintPublicKey: PublicKey
    plugins: VoterWeightPluginInfo[],
    tokenOwnerRecord?: ProgramAccount<TokenOwnerRecord>,
    useOnChainWeight?: boolean
}

type CalculateMaxVoterWeightParams = {
    realmPublicKey: PublicKey,
    governanceMintPublicKey: PublicKey
    plugins: VoterWeightPluginInfo[],
    mintInfo: MintInfo,
    useOnChainWeight?: boolean
}

const handlePluginSuccess = (inputVoterWeight: CalculatedWeight, nextPlugin: VoterWeightPluginInfo, nextWeight: BN | null): CalculatedWeight => {
    if (nextWeight === null) {
        // Plugin failed to calculate voter weight, but did not throw an error, so we just assign a generic error
        return {
            value: null,
            details: [
                ...inputVoterWeight.details,
                {
                    pluginName: nextPlugin.name,
                    pluginWeight: null,
                    error: new Error('Plugin failed to calculate voter weight')
                }
            ]
        };
    }

    return {
        value: nextWeight,
        details: [
            ...inputVoterWeight.details,
            {
                pluginName: nextPlugin.name,
                pluginWeight: nextWeight,
                error: null
            }
        ]
    };
}

const handlePluginError = (inputVoterWeight: CalculatedWeight, nextPlugin: VoterWeightPluginInfo, error: Error): CalculatedWeight => ({
    value: null,
    details: [
        ...inputVoterWeight.details,
        {
            pluginName: nextPlugin.name,
            pluginWeight: null,
            error
        }
    ]
})

export const calculateVoterWeight = async ({
  walletPublicKey,
  realmPublicKey,
  governanceMintPublicKey,
  plugins,
  tokenOwnerRecord
}: CalculateVoterWeightParams): Promise<CalculatedWeight> => {
    console.log("CVW: CALCULATING VOTER WEIGHT");
    const tokenOwnerRecordPower = tokenOwnerRecord?.account.governingTokenDepositAmount ?? new BN(0)

    const startingWeight: CalculatedWeight = {
        value: tokenOwnerRecordPower,
        details: []
    };

    console.log("CVW: STARTING WEIGHT", startingWeight?.value?.toString());

    const reducer = async (inputVoterWeight: CalculatedWeight, nextPlugin: VoterWeightPluginInfo): Promise<CalculatedWeight> => {
        if (inputVoterWeight.value === null) return inputVoterWeight;

        try {
            const nextWeight = await nextPlugin.client.calculateVoterWeight(walletPublicKey, realmPublicKey, governanceMintPublicKey, inputVoterWeight.value);
            console.log("CVW: NEXT WEIGHT", nextWeight?.toString());
            return handlePluginSuccess(inputVoterWeight, nextPlugin, nextWeight);
        } catch (error) {
            return handlePluginError(inputVoterWeight, nextPlugin, error);
        }
    };

    return reduceAsync<VoterWeightPluginInfo, CalculatedWeight>(plugins, reducer, startingWeight);
}

export const calculateMaxVoterWeight = async ({
     realmPublicKey,
     governanceMintPublicKey,
     plugins,
     mintInfo,
}: CalculateMaxVoterWeightParams): Promise<CalculatedWeight> => {
    const tokenSupply = mintInfo?.supply

    const startingWeight: CalculatedWeight = {
        value: tokenSupply,
        details: []
    };

    const reducer = async (inputVoterWeight: CalculatedWeight, nextPlugin: VoterWeightPluginInfo): Promise<CalculatedWeight> => {
        if (inputVoterWeight.value === null) return inputVoterWeight;

        try {
            const nextWeight = await nextPlugin.client.calculateMaxVoterWeight(realmPublicKey, governanceMintPublicKey, inputVoterWeight.value);
            return handlePluginSuccess(inputVoterWeight, nextPlugin, nextWeight);
        } catch (error) {
            return handlePluginError(inputVoterWeight, nextPlugin, error);
        }
    };

    return reduceAsync<VoterWeightPluginInfo, CalculatedWeight>(plugins, reducer, startingWeight);
}