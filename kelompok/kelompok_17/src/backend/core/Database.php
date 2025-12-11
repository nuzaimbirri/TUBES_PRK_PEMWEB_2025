<?php
class Database
{
    private static ?PDO $instance = null;
    private static array $config = [];
    private function __construct() {}
    private function __clone() {}
    public function __wakeup()
    {
        throw new Exception("Cannot unserialize singleton");
    }
    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            self::$config = require CONFIG_PATH . '/database.php';
            $dsn = sprintf(
                "mysql:host=%s;port=%d;dbname=%s;charset=%s",
                self::$config['host'],
                self::$config['port'],
                self::$config['dbname'],
                self::$config['charset']
            );
            try {
                self::$instance = new PDO(
                    $dsn,
                    self::$config['username'],
                    self::$config['password'],
                    self::$config['options']
                );
            } catch (PDOException $e) {
                error_log("Database connection failed: " . $e->getMessage());
                throw new PDOException("Database connection failed: " . $e->getMessage());
            }
        }
        return self::$instance;
    }
    public static function query(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::getInstance()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    public static function fetchOne(string $sql, array $params = []): ?array
    {
        $result = self::query($sql, $params)->fetch();
        return $result ?: null;
    }
    public static function fetchAll(string $sql, array $params = []): array
    {
        return self::query($sql, $params)->fetchAll();
    }
    public static function lastInsertId(): string
    {
        return self::getInstance()->lastInsertId();
    }
    public static function beginTransaction(): bool
    {
        return self::getInstance()->beginTransaction();
    }
    public static function commit(): bool
    {
        return self::getInstance()->commit();
    }
    public static function rollback(): bool
    {
        return self::getInstance()->rollBack();
    }
}
