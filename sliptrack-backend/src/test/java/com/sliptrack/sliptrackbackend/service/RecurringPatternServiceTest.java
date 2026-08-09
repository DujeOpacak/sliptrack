package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.model.PaymentSlip;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Čist JUnit unit test — bez Spring konteksta, bez baze. RecurringPatternService nema
// vanjske efekte u ovim metodama osim čiste datumske aritmetike, pa nema potrebe za
// Mockitom niti @SpringBootTest. Pokriva rubne slučajeve koji su ranije ručno provjereni
// SQL trikom (preskakanje više propuštenih ciklusa, day-of-month clamping) — vidi CLAUDE.md
// "RecurringPattern predikcija" i DEVLOG 09.08.2026.
class RecurringPatternServiceTest {

    private final RecurringPatternService service =
            new RecurringPatternService(null, null);

    private PaymentSlip slipDueOn(LocalDate dueDate) {
        return PaymentSlip.builder().dueDate(dueDate).build();
    }

    // --- averageCadenceMonths ---

    @Test
    void mjesecniRazmakDajeCadenceJedan() {
        List<PaymentSlip> history = List.of(
                slipDueOn(LocalDate.of(2026, 5, 11)),
                slipDueOn(LocalDate.of(2026, 6, 11)),
                slipDueOn(LocalDate.of(2026, 7, 11)));

        assertThat(service.averageCadenceMonths(history)).isEqualTo(1);
    }

    @Test
    void polugodisnjiRazmakDajeCadenceSest() {
        List<PaymentSlip> history = List.of(
                slipDueOn(LocalDate.of(2025, 8, 10)),
                slipDueOn(LocalDate.of(2026, 2, 10)),
                slipDueOn(LocalDate.of(2026, 8, 10)));

        assertThat(service.averageCadenceMonths(history)).isEqualTo(6);
    }

    @Test
    void mjesovitiRazmaciSeZaokruzuju() {
        // Razmaci 1 i 2 mjeseca -> prosjek 1.5 -> zaokruženo na 2
        List<PaymentSlip> history = List.of(
                slipDueOn(LocalDate.of(2026, 1, 11)),
                slipDueOn(LocalDate.of(2026, 2, 11)),
                slipDueOn(LocalDate.of(2026, 4, 11)));

        assertThat(service.averageCadenceMonths(history)).isEqualTo(2);
    }

    // --- projectNextPredictedDate ---

    @Test
    void predvidaSljedeciMjesecKadDatumJosNijeProsao() {
        LocalDate result = service.projectNextPredictedDate(
                LocalDate.of(2026, 7, 11), 1, 11, LocalDate.of(2026, 8, 9));

        assertThat(result).isEqualTo(LocalDate.of(2026, 8, 11));
    }

    @Test
    void kadPredikcijaTocnoPadneNaDanas_ostajeTamo() {
        LocalDate result = service.projectNextPredictedDate(
                LocalDate.of(2026, 7, 11), 1, 11, LocalDate.of(2026, 8, 11));

        assertThat(result).isEqualTo(LocalDate.of(2026, 8, 11));
    }

    @Test
    void preskacePropusteneCiklusePetPuta_bezPucanja() {
        // Zadnja stvarna uplatnica u siječnju, "danas" je u kolovozu — mora preskočiti
        // veljaču/ožujak/travanj/svibanj/lipanj/srpanj (5 propuštenih ciklusa) bez ijedne
        // nove uplatnice u međuvremenu, i sletjeti na prvi budući datum (11.08.).
        LocalDate result = service.projectNextPredictedDate(
                LocalDate.of(2026, 1, 11), 1, 11, LocalDate.of(2026, 8, 9));

        assertThat(result).isEqualTo(LocalDate.of(2026, 8, 11));
    }

    @Test
    void danSeOgranicavaNaDuljinuKracegMjeseca() {
        // averageDayOfMonth=31, ali veljača 2026. (neprijestupna) ima samo 28 dana
        LocalDate result = service.projectNextPredictedDate(
                LocalDate.of(2026, 1, 31), 1, 31, LocalDate.of(2026, 1, 1));

        assertThat(result).isEqualTo(LocalDate.of(2026, 2, 28));
    }

    @Test
    void prijestupnaGodinaDajeVeljaci29Dana() {
        LocalDate result = service.projectNextPredictedDate(
                LocalDate.of(2028, 1, 31), 1, 31, LocalDate.of(2028, 1, 1));

        assertThat(result).isEqualTo(LocalDate.of(2028, 2, 29));
    }

    @Test
    void polugodisnjaCadencaPreskacePogresneMjesecneKandidata() {
        LocalDate result = service.projectNextPredictedDate(
                LocalDate.of(2026, 8, 10), 6, 10, LocalDate.of(2026, 9, 1));

        assertThat(result).isEqualTo(LocalDate.of(2027, 2, 10));
    }
}
