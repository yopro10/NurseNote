/**
 * Parser SQL para ejecutar archivos con delimitadores $$
 * Resuelve el problema de los triggers y funciones PostgreSQL
 */

export function parseSQL(sql) {
  const statements = [];
  let currentStatement = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;

  while (i < sql.length) {
    // Detectar inicio de $$
    if (!inDollarQuote && sql[i] === '$' && i + 1 < sql.length && sql[i + 1] === '$') {
      inDollarQuote = true;
      dollarTag = '$$';
      currentStatement += '$$';
      i += 2;
      continue;
    }

    // Detectar fin de $$
    if (inDollarQuote && sql[i] === '$' && i + 1 < sql.length && sql[i + 1] === '$') {
      inDollarQuote = false;
      currentStatement += '$$';
      i += 2;
      continue;
    }

    // Detectar inicio de $tag$
    if (!inDollarQuote && sql[i] === '$' && i + 1 < sql.length && sql[i + 1] !== '$') {
      const match = sql.substring(i).match(/^\$([a-zA-Z0-9_]+)\$/);
      if (match) {
        inDollarQuote = true;
        dollarTag = match[0];
        currentStatement += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }

    // Detectar fin de $tag$
    if (inDollarQuote && sql[i] === '$') {
      const match = sql.substring(i).match(/^\$([a-zA-Z0-9_]+)\$/);
      if (match && match[0] === dollarTag) {
        inDollarQuote = false;
        currentStatement += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }

    // Procesar comentarios de línea
    if (!inDollarQuote && sql[i] === '-' && i + 1 < sql.length && sql[i + 1] === '-') {
      // Saltar hasta el final de la línea
      while (i < sql.length && sql[i] !== '\n') {
        i++;
      }
      continue;
    }

    // Procesar comentarios de bloque
    if (!inDollarQuote && sql[i] === '/' && i + 1 < sql.length && sql[i + 1] === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && i + 1 < sql.length && sql[i + 1] === '/')) {
        i++;
      }
      if (i < sql.length) i += 2;
      continue;
    }

    // Detectar punto y coma fuera de $$ para separar statements
    if (!inDollarQuote && sql[i] === ';') {
      currentStatement += ';';
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      currentStatement = '';
      i++;
      continue;
    }

    currentStatement += sql[i];
    i++;
  }

  // Agregar el último statement si existe
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

export async function executeSQLFile(client, sql) {
  const statements = parseSQL(sql);
  const errors = [];

  for (const statement of statements) {
    try {
      await client.query(statement);
    } catch (err) {
      // Ignorar errores de objetos que ya existen
      if (!err.message.includes('already exists') && !err.message.includes('does not exist')) {
        errors.push({
          statement: statement.substring(0, 100) + '...',
          error: err.message
        });
      }
    }
  }

  return errors;
}
