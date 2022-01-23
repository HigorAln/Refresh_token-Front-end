import axios from "axios";
import type { GetServerSideProps, NextPage } from "next";
import { FormEvent, useState } from "react";
import { parseCookies, setCookie } from "nookies";
import toast, { Toaster } from "react-hot-toast";
import Router from "next/router";
import { withSSRGuest } from "../utils/withSSRGuest";

const Home: NextPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassowrd] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      const { data, status } = await axios.post("http://localhost:5000/login", {
        username,
        password,
      });
      if (status == 200) {
        setCookie(null, "@app-token", data.token);
        setCookie(null, "@app-refresh_token", data.refreshToken.id);

        Router.push("/dashboard");
      }
    } catch (e) {
      toast.error("Login ou password Incorrecly");
    }
  }

  return (
    <div>
      <Toaster />
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassowrd(e.target.value)}
        />
        <button type="submit">Confirm</button>
      </form>
    </div>
  );
};

export default Home;

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {},
  };
});
