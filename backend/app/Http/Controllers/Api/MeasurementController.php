<?php

namespace App\Http\Controllers\Api;

use App\Enums\SkillType;
use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\Measurement;
use App\Models\Skill;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * القياس — timed swims a coach records for swimmers during a session.
 *
 * The options are not a config of their own: a stroke is a SWIM_TYPE skill and
 * a distance is a DISTANCE skill (meters in skills.numeric_value), both managed
 * by the club on the portal's Skills page.
 */
class MeasurementController extends Controller
{
    private const WITH = [
        'swimmer:id,first_name,last_name,photo_token',
        'strokeSkill:id,name',
        'distanceSkill:id,name,numeric_value',
    ];

    /** What the coach picks from: the club's strokes and distances. */
    public function options(): JsonResponse
    {
        $clubId = app('current_club_id');

        return response()->json([
            'strokes' => Skill::where('club_id', $clubId)
                ->where('type', SkillType::SWIM_TYPE->value)
                ->orderBy('name')
                ->get(['id', 'name']),
            'distances' => Skill::where('club_id', $clubId)
                ->where('type', SkillType::DISTANCE->value)
                ->orderBy('numeric_value')
                ->get(['id', 'name', 'numeric_value']),
        ]);
    }

    public function index(Request $request, int $session): JsonResponse
    {
        $trainingSession = $this->coachSession($request, $session);

        $measurements = Measurement::where('session_id', $trainingSession->id)
            ->with(self::WITH)
            ->latest()
            ->latest('id')
            ->get();

        return response()->json(['data' => $measurements]);
    }

    public function store(Request $request, int $session): JsonResponse
    {
        $trainingSession = $this->coachSession($request, $session);
        $clubId = app('current_club_id');

        $validated = $request->validate([
            'swimmer_id' => 'required|integer',
            'stroke_skill_id' => 'required|integer',
            'distance_skill_id' => 'required|integer',
            'time_seconds' => 'required|numeric|min:0.01|max:99999.99',
        ]);

        // A time is swum in a session: nothing to measure before it starts or
        // after it was cancelled.
        if (! in_array($trainingSession->status, ['Live', 'Completed'], true)) {
            throw ValidationException::withMessages([
                'session' => 'Measurements can only be recorded once the session has started.',
            ]);
        }

        // The swimmer has to be on this session's roster (group members, plus
        // swimmers added to the session, minus the excluded).
        $trainingSession->loadMissing(['group.swimmers', 'sessionSwimmers', 'sessionExclusions']);
        if (! $trainingSession->effective_swimmers->contains('id', (int) $validated['swimmer_id'])) {
            throw ValidationException::withMessages([
                'swimmer_id' => 'This swimmer is not in this session.',
            ]);
        }

        // The picked options must be this club's, and of the right type.
        $stroke = $this->clubSkill($clubId, (int) $validated['stroke_skill_id'], SkillType::SWIM_TYPE, 'stroke_skill_id', 'Choose one of your club\'s swim types.');
        $distance = $this->clubSkill($clubId, (int) $validated['distance_skill_id'], SkillType::DISTANCE, 'distance_skill_id', 'Choose one of your club\'s distances.');

        $measurement = Measurement::create([
            'club_id' => $clubId,
            'session_id' => $trainingSession->id,
            'swimmer_id' => (int) $validated['swimmer_id'],
            'stroke_skill_id' => $stroke->id,
            'distance_skill_id' => $distance->id,
            'time_seconds' => $validated['time_seconds'],
            'recorded_by' => $request->user()->id,
        ]);

        return response()->json($measurement->load(self::WITH), 201);
    }

    public function destroy(Request $request, int $session, int $measurement): JsonResponse
    {
        $trainingSession = $this->coachSession($request, $session);

        $row = Measurement::where('session_id', $trainingSession->id)->findOrFail($measurement);
        abort_unless($row->recorded_by === $request->user()->id, 403, 'Only the coach who recorded a measurement can delete it.');

        $row->delete();

        return response()->json(['status' => 'deleted']);
    }

    /** A swimmer's history, for the coach portal: only swimmers in the coach's groups. */
    public function forCoachSwimmer(Request $request, int $swimmer): JsonResponse
    {
        $groupIds = Group::where('coach_user_id', $request->user()->id)->pluck('id');

        $profile = SwimmerProfile::findOrFail($swimmer);
        abort_unless(
            $profile->groups()->whereIn('groups.id', $groupIds)->exists(),
            403,
            'Swimmer not in your groups'
        );

        return $this->history($request, $profile);
    }

    /** A swimmer's history, for the club manager. */
    public function forClubSwimmer(Request $request, int $swimmer): JsonResponse
    {
        return $this->history($request, SwimmerProfile::findOrFail($swimmer));
    }

    private function history(Request $request, SwimmerProfile $profile): JsonResponse
    {
        $request->validate(['per_page' => 'nullable|integer|min:1|max:100']);

        $measurements = Measurement::where('club_id', app('current_club_id'))
            ->where('swimmer_id', $profile->id)
            ->with(['strokeSkill:id,name', 'distanceSkill:id,name,numeric_value', 'session:id,date,title', 'recordedBy:id,name'])
            ->latest()
            ->latest('id')
            ->paginate((int) $request->input('per_page', 20));

        return response()->json($measurements);
    }

    /**
     * The session, if it belongs to a group this coach coaches — the same
     * ownership rule as every session route in CoachApiController, so another
     * coach's session is a 404 here too.
     */
    private function coachSession(Request $request, int $sessionId): TrainingSession
    {
        $groupIds = Group::where('coach_user_id', $request->user()->id)->pluck('id');

        return TrainingSession::whereIn('group_id', $groupIds)->findOrFail($sessionId);
    }

    private function clubSkill(int $clubId, int $id, SkillType $type, string $field, string $message): Skill
    {
        $skill = Skill::where('club_id', $clubId)->where('type', $type->value)->find($id);

        if (! $skill) {
            throw ValidationException::withMessages([$field => $message]);
        }

        return $skill;
    }
}
