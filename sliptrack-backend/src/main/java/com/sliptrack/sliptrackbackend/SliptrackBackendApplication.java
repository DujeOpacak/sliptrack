package com.sliptrack.sliptrackbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SliptrackBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SliptrackBackendApplication.class, args);
    }

}
