// HV Consultores - Bank RPA Tasks
// Exportaciones centralizadas

export * from './bank-base-task'
export * from './bancochile.task'

// Factory function to create appropriate bank task
import { BankBaseTask, BankTaskContext, BankCode } from './bank-base-task'
import { createBancoChileTask } from './bancochile.task'

export function createBankTask(banco: BankCode, context: BankTaskContext): BankBaseTask {
  switch (banco) {
    case 'bancochile':
      return createBancoChileTask(context)
    // TODO: Implement other banks
    // case 'bancoestado':
    //   return createBancoEstadoTask(context)
    // case 'santander':
    //   return createSantanderTask(context)
    // case 'bci':
    //   return createBCITask(context)
    default:
      throw new Error(`Unsupported bank: ${banco}`)
  }
}

// Bank task types supported
export const SUPPORTED_BANKS: BankCode[] = ['bancochile']

// Check if bank is supported
export function isBankSupported(banco: string): banco is BankCode {
  return SUPPORTED_BANKS.includes(banco as BankCode)
}
