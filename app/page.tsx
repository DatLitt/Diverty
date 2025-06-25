"use client";
import Link from "next/link";
import styles from "./page.module.css";
import Image from "next/image";

export default function Home() {
  return (
    <div className={styles.home}>
      <div className={styles.introduction}>
        <Image
          src="/landingpage.jpg"
          alt="Landing page image"
          width={1000} // your desired width
          height={0} // dummy value (will be overridden)
          style={{ height: "auto" }} // auto-adjusts height to natural ratio
        />
        <h1 className={styles.slogan}>
          {" "}
          Build Smarter Investment Portfolios with Diverty
        </h1>
        {/* <h2 className={styles.slogan2}>
        Optimize your investments with data-driven insights, efficient frontier
        analysis, and personalized risk-return strategies.
      </h2> */}
        <div className={styles.buttonWrapper}>
          <a className={styles.tutorial} href="#tutorial">
            View tutorial
          </a>
          <Link
            href="/portfolio"
            className="primaryButton"
            style={{ textDecoration: "none" }}
          >
            Get Started
          </Link>
        </div>
      </div>
      <div className={styles.tutorialWrapper} id="tutorial">
        <Image
          src="/tutor1.jpg"
          alt="Landing page image"
          width={1000} // your desired width
          height={0} // dummy value (will be overridden)
          style={{ height: "auto" }} // auto-adjusts height to natural ratio
        />
        <Image
          src="/tutor2.jpg"
          alt="Landing page image"
          width={1000} // your desired width
          height={0} // dummy value (will be overridden)
          style={{ height: "auto" }} // auto-adjusts height to natural ratio
        />
        <Image
          src="/tutor3.jpg"
          alt="Landing page image"
          width={1000} // your desired width
          height={0} // dummy value (will be overridden)
          style={{ height: "auto" }} // auto-adjusts height to natural ratio
        />
        <Link
          href="/portfolio"
          className="primaryButton"
          style={{ textDecoration: "none" }}
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
