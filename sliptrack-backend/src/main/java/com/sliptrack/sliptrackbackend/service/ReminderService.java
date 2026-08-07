package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.enums.PaymentStatus;
import com.sliptrack.sliptrackbackend.model.PaymentSlip;
import com.sliptrack.sliptrackbackend.model.RecurringPattern;
import com.sliptrack.sliptrackbackend.model.UserDevice;
import com.sliptrack.sliptrackbackend.repository.NotificationRepository;
import com.sliptrack.sliptrackbackend.repository.PaymentSlipRepository;
import com.sliptrack.sliptrackbackend.repository.RecurringPatternRepository;
import com.sliptrack.sliptrackbackend.repository.UserDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderService {

    private static final String UPCOMING_PREFIX = "Uskoro dospijeva";
    private static final String DUE_TODAY_PREFIX = "Danas dospijeva";
    private static final String OVERDUE_PREFIX = "Dospjelo, neplaćena";

    @Value("${reminder.days-ahead:3}")
    private int daysAhead;

    private final PaymentSlipRepository paymentSlipRepository;
    private final RecurringPatternRepository recurringPatternRepository;
    private final NotificationRepository notificationRepository;
    private final UserDeviceRepository userDeviceRepository;
    private final RecurringPatternService recurringPatternService;
    private final NotificationService notificationService;
    private final ExpoPushService expoPushService;

    @Scheduled(cron = "${reminder.cron:0 0 8 * * *}")
    public void runDailyReminders() {
        recurringPatternService.recomputeAll();
        sendUpcomingReminders();
        sendDueTodayReminders();
        sendOverdueReminders();
        sendPredictedReminders();
    }

    private void sendUpcomingReminders() {
        LocalDate today = LocalDate.now();
        LocalDate from = today.plusDays(1);
        LocalDate until = today.plusDays(daysAhead);

        List<PaymentSlip> upcoming = paymentSlipRepository.findByStatusAndDueDateBetween(PaymentStatus.UNPAID, from, until);

        for (PaymentSlip slip : upcoming) {
            if (notificationRepository.existsByPaymentSlipIdAndMessageStartingWith(slip.getId(), UPCOMING_PREFIX)) {
                continue;
            }

            String message = UPCOMING_PREFIX + " uplatnica za " + slip.getProviderName() + " (" + slip.getDueDate() + ").";
            notificationService.create(slip.getUser(), slip, message);
            notifyDevices(slip.getUser().getId(), "Uskoro dospijeva uplatnica", message);
        }
    }

    private void sendDueTodayReminders() {
        LocalDate today = LocalDate.now();

        List<PaymentSlip> dueToday = paymentSlipRepository.findByStatusAndDueDate(PaymentStatus.UNPAID, today);

        for (PaymentSlip slip : dueToday) {
            if (notificationRepository.existsByPaymentSlipIdAndMessageStartingWith(slip.getId(), DUE_TODAY_PREFIX)) {
                continue;
            }

            String message = DUE_TODAY_PREFIX + " uplatnica za " + slip.getProviderName() + ".";
            notificationService.create(slip.getUser(), slip, message);
            notifyDevices(slip.getUser().getId(), "Uplatnica dospijeva danas", message);
        }
    }

    private void sendOverdueReminders() {
        LocalDate today = LocalDate.now();

        List<PaymentSlip> overdue = paymentSlipRepository.findByStatusAndDueDateBefore(PaymentStatus.UNPAID, today);

        for (PaymentSlip slip : overdue) {
            if (notificationRepository.existsByPaymentSlipIdAndMessageStartingWith(slip.getId(), OVERDUE_PREFIX)) {
                continue;
            }

            String message = OVERDUE_PREFIX + " uplatnica za " + slip.getProviderName() + " (rok " + slip.getDueDate() + ").";
            notificationService.create(slip.getUser(), slip, message);
            notifyDevices(slip.getUser().getId(), "Uplatnica je dospjela", message);
        }
    }

    private void sendPredictedReminders() {
        LocalDate today = LocalDate.now();
        LocalDate until = today.plusDays(daysAhead);

        List<RecurringPattern> predicted = recurringPatternRepository.findByNextPredictedDateBetween(today, until);

        for (RecurringPattern pattern : predicted) {
            YearMonth targetMonth = YearMonth.from(pattern.getNextPredictedDate());

            if (pattern.getLastReminderSentAt() != null
                    && YearMonth.from(pattern.getLastReminderSentAt()).equals(targetMonth)) {
                continue;
            }

            boolean alreadyTracked = paymentSlipRepository.existsByUserIdAndProviderNameAndDueDateBetween(
                    pattern.getUser().getId(), pattern.getProviderName(),
                    targetMonth.atDay(1), targetMonth.atEndOfMonth());
            if (alreadyTracked) {
                continue;
            }

            String message = "Uskoro se očekuje uplatnica za " + pattern.getProviderName()
                    + " (procjena " + pattern.getNextPredictedDate() + ").";
            notificationService.create(pattern.getUser(), null, message);
            notifyDevices(pattern.getUser().getId(), "Očekivana uplatnica", message);

            pattern.setLastReminderSentAt(today);
            recurringPatternRepository.save(pattern);
        }
    }

    private void notifyDevices(Long userId, String title, String body) {
        List<UserDevice> devices = userDeviceRepository.findByUserId(userId);
        if (!devices.isEmpty()) {
            expoPushService.sendToDevices(devices, title, body);
        }
    }
}
