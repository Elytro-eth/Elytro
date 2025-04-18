All hot bytes4 from dune.com

```sql
SELECT
  *
FROM (
  SELECT
    bytes4,
    COUNT(0) AS c
  FROM (
    SELECT
SUBSTRING(CAST(data AS VARCHAR), 1, 10) AS bytes4
    FROM ethereum.transactions
    WHERE
      block_number > 16602979 AND data <> 0x
  ) AS t1
  GROUP BY
    bytes4
) AS t2
ORDER BY
  c DESC NULLS FIRST
LIMIT 6000
```

