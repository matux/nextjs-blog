import Link from "next/link";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import React, { useEffect, useState } from "react";
import { Provider, ErrorBoundary, useRollbar } from "@rollbar/react";
import Rollbar from "rollbar/src/browser/rollbar";

const rollbarConfig = {
  accessToken:
    "f7db1bf59c26440ba807c609ab2be17e16d9d00b7eb0cce6840c7b1f92f8d383046901135a253736922ff9bd8c73e5e3",
  //"bc68f1eafc124f40bcf40421017c4dc414bd76b7658c2e766f4a177c7a435091bfbb0c51c41fd96242633083f37ad775",
  //accessToken: "d8c0f28d2b3744ed9cf4aebe54c21dd0", // rollbardev:SeshRep01
  //endpoint: "https://api.rollbar.com/api/1/item",
  endpoint: "http://localhost:8000/api/1/item",
  captureUncaught: true,
  captureUnhandledRejections: true,
  recorder: {
    enabled: true,
    autoStart: true, // Start recording automatically when Rollbar initializes
    debug: {
      logEmits: true, // Whether to log emitted events
    },
  },
  payload: {
    environment: "testenv",
    code_version: "cf29e4a",
    client: {
      javascript: {
        source_map_enabled: true,
        code_version: "cf29e4a",
        guess_uncaught_frames: true,
      },
      user_ip: "2001:268:98d5:9c3c:699f:9ef8:14fa:1050",
    },
    server: {
      host: "web:1",
      root: "webpack://_N_E/./pages/",
      branch: "main",
    },
    person: {
      id: 1234,
      email: "local@host.com",
      username: "localuser",
    },
  },
};

export default function App() {
  //console.log(rollbarConfig);
  const rollbar = new Rollbar(rollbarConfig);

  return (
    <Provider instance={rollbar}>
      <ErrorBoundary>
        <Home />
        {/* <AnotherError /> */}
      </ErrorBoundary>
    </Provider>
  );
}

function TestError() {
  const a = null;
  return a.hello();
}

function AnotherError() {
  const rollbar = useRollbar();
  const [flag, setFlag] = useState(false);

  useEffect(() => {
    const a = null;
    setFlag(true);
    a.hello();
  });

  return <>{flag}</>;
}

function Home() {
  const rollbar = useRollbar();

  // Function to trigger a manually reported error
  const triggerManualError = () => {
    try {
      // Simulate an error
      throw new Error("Manually triggered error for Rollbar testing");
    } catch (error) {
      // Manually report to Rollbar
      rollbar.error("Manual error caught and reported", error);
      alert("Error reported to Rollbar successfully!");
    }
  };

  // Function to trigger an uncaught error
  const triggerUncaughtError = () => {
    // This will cause an uncaught error that Rollbar should catch
    const nullObject = null;
    nullObject.nonExistentMethod();
  };

  // Function to trigger an error in a promise
  const triggerPromiseError = () => {
    // This creates a rejected promise that should be caught by Rollbar
    new Promise((resolve, reject) => {
      reject(new Error("Promise rejection for Rollbar testing"));
    });
    alert("Promise error triggered!");
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className={styles.title}>
          Read <Link href="https://nextjs.org">Next.js!</Link>
        </h1>

        <p className={styles.description}>
          Get started by editing <code>pages/index.js</code>
        </p>

        {/* Rollbar Test Buttons */}
        <div className={styles.errorButtons}>
          <h2>Rollbar Error Testing</h2>
          <button onClick={triggerManualError} className={styles.errorButton}>
            Trigger Manual Error
          </button>
          <button onClick={triggerUncaughtError} className={styles.errorButton}>
            Trigger Uncaught Error
          </button>
          <button onClick={triggerPromiseError} className={styles.errorButton}>
            Trigger Promise Rejection
          </button>
        </div>

        <div className={styles.grid}>
          <a href="https://nextjs.org/docs" className={styles.card}>
            <h3>Documentation &rarr;</h3>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>

          <a href="https://nextjs.org/learn" className={styles.card}>
            <h3>Learn &rarr;</h3>
            <p>Learn about Next.js in an interactive course with quizzes!</p>
          </a>

          <a
            href="https://github.com/vercel/next.js/tree/canary/examples"
            className={styles.card}
          >
            <h3>Examples &rarr;</h3>
            <p>Discover and deploy boilerplate example Next.js projects.</p>
          </a>

          <a
            href="https://vercel.com/import?filter=next.js&utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className={styles.card}
          >
            <h3>Deploy &rarr;</h3>
            <p>
              Instantly deploy your Next.js site to a public URL with Vercel.
            </p>
          </a>
        </div>
      </main>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <img src="/vercel.svg" alt="Vercel" className={styles.logo} />
        </a>
      </footer>

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer img {
          margin-left: 0.5rem;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
