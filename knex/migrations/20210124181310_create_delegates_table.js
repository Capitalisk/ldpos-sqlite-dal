const table = require("../ldpos-table-schema").delegatesTable;
const tableName = table.name;
exports.up = function(knex) {
    return Promise.resolve(
        knex.schema.createTable(tableName, (tbl) => {
            tbl.string(table.field.address, 50).primary().notNullable().index();
            tbl.bigInteger(table.field.voteWeight).notNullable().index();
            tbl.integer(table.field.updateHeight).nullable();
        }),
    )
};

exports.down = function(knex) {
    return Promise.resolve(knex.schema.dropTable(tableName));
};
