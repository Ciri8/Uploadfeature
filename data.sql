CREATE TABLE diabetes_data (
  id SERIAL PRIMARY KEY,
  pregnancies INTEGER NOT NULL,
  glucose INTEGER NOT NULL,
  bloodpressure INTEGER NOT NULL,
  skinthickness INTEGER NOT NULL,
  insulin INTEGER NOT NULL,
  bmi FLOAT NOT NULL,
  diabetespedigreefunction FLOAT NOT NULL,
  age INTEGER NOT NULL,
  outcome INTEGER NOT NULL,
  file_path TEXT NOT NULL
);
