import { PublicKey } from '@solana/web3.js'
import { QuadraticClient } from './accounts'

export const tryGetQuadraticRegistrar = async (
  registrarPk: PublicKey,
  client: QuadraticClient
) => {
  try {
    const existingRegistrar = await client.program.account.registrar.fetch(
      registrarPk
    )
    return existingRegistrar
  } catch (e) {
    return null
  }
}
