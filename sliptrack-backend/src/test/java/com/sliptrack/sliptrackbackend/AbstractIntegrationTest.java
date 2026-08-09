package com.sliptrack.sliptrackbackend;

import com.sliptrack.sliptrackbackend.dto.LoginRequest;
import com.sliptrack.sliptrackbackend.dto.RegisterRequest;
import com.sliptrack.sliptrackbackend.enums.Role;
import com.sliptrack.sliptrackbackend.model.User;
import com.sliptrack.sliptrackbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Zajednička baza za sve integracijske (*IT) testove: pravi Postgres preko Testcontainersa
// (ne H2 — projekt ima native SQL upit s Postgres-specifičnim TO_CHAR-om, vidi
// PaymentSlipRepository.sumAmountGroupedByMonth), MockMvc umjesto RANDOM_PORT (potrebno da
// @Transactional rollback nakon svakog testa stvarno obuhvati i HTTP zahtjev — pravi server
// na zasebnom threadu ne bi dijelio test-transakciju). MinIO endpoint prebačen na localhost
// jer minio.endpoint u application.properties cilja LAN IP (za fizički mobilni uređaj), koji
// u testnom okruženju ne mora biti dohvatljiv — lokalni docker-compose MinIO kontejner sluša
// i na localhost:9000.
//
// "Singleton container" obrazac (namjerno BEZ @Testcontainers/@Container): kontejner se
// pokreće ručno jednom u static bloku i nikad se eksplicitno ne gasi — Testcontainers Ryuk
// resource reaper ga počisti na kraju cijelog JVM procesa. @Testcontainers bi ga zaustavio
// nakon SVAKE test klase koja nasljeđuje ovu baznu klasu (static polje se dijeli, ali
// lifecycle anotacije rade po-klasi), pa bi druga i treća *IT klasa u istom mvn test
// pokretanju dobile već ugašen kontejner — otkriveno upravo na taj način (AuthControllerIT
// prošao, PaymentSlipControllerIT pao na "Connection refused").
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18");

    static {
        postgres.start();
    }

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("minio.endpoint", () -> "http://localhost:9000");
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    protected static final String DEFAULT_PASSWORD = "lozinka123";

    /** Registrira novog USER korisnika preko stvarnog /api/auth/register endpointa i vraća access token. */
    protected String registerAndGetAccessToken(String email) throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Test");
        request.setLastName("Korisnik");
        request.setEmail(email);
        request.setPassword(DEFAULT_PASSWORD);

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return extractAccessToken(result);
    }

    /**
     * Nema register endpointa za ADMIN (namjerno — admin računi se provisioniraju ručno, ne
     * self-registracijom, vidi CLAUDE.md sigurnosni model), pa se ovdje admin ubacuje izravno
     * kroz repository, a token se dobiva pravim /api/auth/login pozivom.
     */
    protected String createAdminAndGetAccessToken(String email) throws Exception {
        User admin = User.builder()
                .firstName("Admin")
                .lastName("Test")
                .email(email)
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .role(Role.ADMIN)
                .active(true)
                .build();
        userRepository.save(admin);

        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(DEFAULT_PASSWORD);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return extractAccessToken(result);
    }

    private String extractAccessToken(MvcResult result) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("accessToken").asText();
    }
}
