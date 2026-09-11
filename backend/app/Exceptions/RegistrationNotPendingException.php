<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown inside the approval transaction when the locked registration row turns out
 * to be non-pending — i.e. a concurrent request already approved or cancelled it.
 *
 * Its only job is to roll the transaction back and be distinguishable from a genuine
 * failure, so the caller answers 422 ("already handled") instead of 500.
 */
class RegistrationNotPendingException extends RuntimeException {}
