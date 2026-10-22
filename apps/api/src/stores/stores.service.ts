import { Injectable } from '@nestjs/common';
import type { CheckHandleResponseDto } from './dto/check-handle.dto.js';
import {
  STORE_HANDLE_MIN_LENGTH,
  findStoreHandleProblem,
  toStoreHandle,
  type StoreHandleProblem,
} from './store-handle.js';

const PROBLEM_MESSAGES: Record<StoreHandleProblem, string> = {
  too_short: `Use pelo menos ${STORE_HANDLE_MIN_LENGTH} letras ou números`,
  invalid: 'Use só letras, números e hífens',
  reserved: 'Esse endereço é reservado',
};

@Injectable()
export class StoresService {
  // TODO(phase 2): check the stores table for handles already in use.
  checkHandle(input: string): CheckHandleResponseDto {
    const handle = toStoreHandle(input);
    const problem = findStoreHandleProblem(handle);

    if (problem) {
      return { handle, available: false, message: PROBLEM_MESSAGES[problem] };
    }
    return { handle, available: true };
  }
}
