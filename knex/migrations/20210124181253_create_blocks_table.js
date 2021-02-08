const table = require("../ldpos-table-schema").blocksTable;
const tableName = table.name;
exports.up = function(knex) {
    return Promise.resolve(
        knex.schema.createTable(tableName, (tbl) => {
            tbl.string(table.field.id, 40).primary().notNullable().index();
            tbl.integer(table.field.height).notNullable().unique().index();
            tbl.integer(table.field.timestamp).notNullable().index();
            tbl.string(table.field.previousBlockId, 40).nullable();
            tbl.string(table.field.forgerAddress, 50).notNullable().index();
            tbl.string(table.field.forgingPublicKey, 64).notNullable();
            tbl.string(table.field.nextForgingPublicKey, 64).notNullable();
            tbl.integer(table.field.nextForgingKeyIndex).notNullable();
            tbl.string(table.field.forgerSignature, 32984).notNullable();
            tbl.text(table.field.signatures).notNullable();
            tbl.boolean(table.field.synched).defaultTo(false);
            tbl.integer(table.field.numberOfTransactions);
        }),
    )
};

exports.down = function(knex) {
    return Promise.resolve(knex.schema.dropTable(tableName));
};
