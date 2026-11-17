/**
 * Logger estructurado mínimo (JSON lines).
 *
 * Se escribe directo a los streams de Node para no depender de `console.*`
 * (evita mensajes de depuración sueltos en el código de producción).
 */
type LogLevel = 'info' | 'warn' | 'error';

interface LogMeta {
  [key: string]: unknown;
}

function writeLog(level: LogLevel, message: string, meta?: LogMeta): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  };

  const line = `${JSON.stringify(entry)}\n`;
  if (level === 'error') {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export const logger = {
  info(message: string, meta?: LogMeta): void {
    writeLog('info', message, meta);
  },
  warn(message: string, meta?: LogMeta): void {
    writeLog('warn', message, meta);
  },
  error(message: string, error?: unknown): void {
    const meta =
      error instanceof Error
        ? { error: error.message, stack: error.stack }
        : error === undefined
          ? undefined
          : { error: String(error) };
    writeLog('error', message, meta);
  },
};
