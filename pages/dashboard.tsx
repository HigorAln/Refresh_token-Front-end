import { useEffect } from "react";
import { api } from "../services/apiClient";
import { setupApiCLient } from "../services/AxiosServices";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard({ user }: { user: [] }) {
  useEffect(() => {
    api.post("/take/user").then((result) => console.log(result.data));
  }, []);

  return (
    <div>
      <h1>{}</h1>
    </div>
  );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupApiCLient(ctx);
  const { data } = await apiClient.post("/take/user");

  return {
    props: { user: data },
  };
});
