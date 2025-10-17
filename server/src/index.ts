import app from "./app";

const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";

app.listen(port, host, () => {
  console.log(`api listening on http://${host}:${port}`);
});
