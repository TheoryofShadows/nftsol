package com.nftsol;

import io.sentry.Sentry;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class App {
  public static void main(String[] args) {
    Sentry.init(options -> {
      options.setDsn(System.getenv("SENTRY_DSN") != null ? System.getenv("SENTRY_DSN") : "https://730b044922f12abcaf6a5d0c4bab2e4c@o4509775589343232.ingest.us.sentry.io/4510104377753600");
      options.setEnvironment("production");
    });
    SpringApplication.run(App.class, args);
    try {
      throw new Exception("Test Sentry in Java");
    } catch (Exception e) {
      Sentry.captureException(e);
    }
  }
}