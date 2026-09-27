#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/45fc03e01ddd7d4135abd0833335477ecde21b120ec77e8fcdb7fc66dfd300c5/contract';
import startContract from '../../snapshots/45fc03e01ddd7d4135abd0833335477ecde21b120ec77e8fcdb7fc66dfd300c5/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f61141ae2667e01079c85856e7877bc759fb9381d150cef238651d85067fc774/contract';
import endContract from '../../snapshots/f61141ae2667e01079c85856e7877bc759fb9381d150cef238651d85067fc774/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'todos',
        column: col('due_date', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
