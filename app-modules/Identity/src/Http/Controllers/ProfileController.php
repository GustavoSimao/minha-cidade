<?php

declare(strict_types=1);

namespace MinhaCidade\Identity\Http\Controllers;

use Illuminate\Routing\Controller;
use MinhaCidade\Identity\Models\User;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ProfileController extends Controller
{
    public function show(string $username): View
    {
        $user = User::where('username', $username)
            ->with('profile')
            ->withCount([
                'friends',
                'publications',
                'createdEvents',
                'supportedPublications as causes_count',
            ])
            ->firstOrFail();

        $stats = [
            'friends'       => $user->friends_count,
            'publications'  => $user->publications_count,
            'events_created'=> $user->created_events_count,
            'causes'        => $user->causes_count,
        ];

        return view('profile-public', compact('user', 'stats'));
    }
}