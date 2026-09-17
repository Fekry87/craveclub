<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown inside the approval transaction when the group the applicant is being placed
 * in has no remaining spot once its row is locked. Two managers approving into the
 * last seat at the same moment both pass the unlocked pre-check; only the one that
 * holds the lock first gets the seat, and the other lands here instead of overfilling.
 *
 * Rolls the transaction back and is answered with a 422 the portal can explain,
 * rather than the generic 500 a bare exception would produce.
 */
class GroupFullException extends RuntimeException {}
