import sys

def error_message_detail(error, error_detail: sys):
    """
    Create a detailed error message showing:
    - file where the error occurred
    - line number
    - actual error message
    """

    _, _, exc_tb = error_detail.exc_info()

    file_name = exc_tb.tb_frame.f_code.co_filename
    line_number = exc_tb.tb_lineno

    return (
        f"Error in script [{file_name}] "
        f"line [{line_number}] "
        f"message [{str(error)}]"
    )

class CustomException(Exception):

    def __init__(self, error_message, error_detail: sys):
        super().__init__(error_message)

        self.error_message = error_message_detail(
            error_message,
            error_detail
        )

    def __str__(self):
        return self.error_message