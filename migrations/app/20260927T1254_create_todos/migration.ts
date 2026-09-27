#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/45fc03e01ddd7d4135abd0833335477ecde21b120ec77e8fcdb7fc66dfd300c5/contract';
import endContract from '../../snapshots/45fc03e01ddd7d4135abd0833335477ecde21b120ec77e8fcdb7fc66dfd300c5/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'todos',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_completed', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'todos',
        index: 'todos_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'todos',
        foreignKey: {
          name: 'todos_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'auth', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'todos' }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'todos',
        policy: {
          naming: { kind: 'wire', prefix: 'todos_delete_own', hash: '07b8e963' },
          tableName: 'todos',
          namespaceId: 'public',
          operation: 'delete',
          roles: ['authenticated'],
          using: '"user_id"::uuid = auth.uid()',
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'todos',
        policy: {
          naming: { kind: 'wire', prefix: 'todos_insert_own', hash: 'a29795f4' },
          tableName: 'todos',
          namespaceId: 'public',
          operation: 'insert',
          roles: ['authenticated'],
          withCheck: '"user_id"::uuid = auth.uid()',
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'todos',
        policy: {
          naming: { kind: 'wire', prefix: 'todos_select_own', hash: 'f6830410' },
          tableName: 'todos',
          namespaceId: 'public',
          operation: 'select',
          roles: ['authenticated'],
          using: '"user_id"::uuid = auth.uid()',
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'todos',
        policy: {
          naming: { kind: 'wire', prefix: 'todos_update_own', hash: '2078ff49' },
          tableName: 'todos',
          namespaceId: 'public',
          operation: 'update',
          roles: ['authenticated'],
          using: '"user_id"::uuid = auth.uid()',
          withCheck: '"user_id"::uuid = auth.uid()',
          permissive: true,
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
