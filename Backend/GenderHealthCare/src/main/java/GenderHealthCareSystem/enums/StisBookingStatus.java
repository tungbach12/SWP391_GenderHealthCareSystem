package GenderHealthCareSystem.enums;

public enum StisBookingStatus {
    PENDING,
    FAILED_PAYMENT,
    CONFIRMED,
    PENDING_TEST_RESULT,
    COMPLETED,
    CANCELLED,
    NO_SHOW, //Người đặt không đến đúng giờ, không thông báo, và bỏ lỡ lịch khám
    DENIED,//Người đặt không đủ điều kiện để đặt lịch khám
    DELETED //Người đặt đã xóa lịch khám, không cần đến nữa

}
