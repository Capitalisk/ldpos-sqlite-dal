const table = require("../ldpos-table-schema").accountsTable;
const tableName = table.name;

exports.up = function(knex) {
    return Promise.resolve(
        knex.schema.createTable(tableName, (tbl) => {
            tbl.string(table.field.address, 50).primary().notNullable().index();
            tbl.string(table.field.type, 30).defaultTo("sig").notNullable();
            tbl.bigInteger(table.field.balance).notNullable().index();
            tbl.string(table.field.forgingPublicKey, 64).nullable();
            tbl.integer(table.field.nextForgingKeyIndex).nullable();
            tbl.string(table.field.multisigPublicKey, 64).nullable();
            tbl.integer(table.field.nextMultisigKeyIndex).nullable();
            tbl.string(table.field.sigPublicKey, 64).nullable();
            tbl.integer(table.field.nextSigKeyIndex).nullable();
            tbl.integer(table.field.requiredSignatureCount).nullable();
            tbl.integer(table.field.updateHeight).nullable();
            tbl.integer(table.field.lastTransactionTimestamp).nullable();
            tbl.string(table.field.nextForgingPublicKey, 64).nullable();
            tbl.string(table.field.nextMultisigPublicKey, 64).nullable();
            tbl.string(table.field.nextSigPublicKey, 64).nullable();
        }),
    )
};

exports.down = function(knex) {
    return Promise.resolve(knex.schema.dropTable(tableName));
};
