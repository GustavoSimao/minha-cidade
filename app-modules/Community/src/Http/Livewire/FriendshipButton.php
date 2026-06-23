<?php

declare(strict_types=1);

namespace MinhaCidade\Community\Http\Livewire;

use Livewire\Component;
use MinhaCidade\Identity\Models\User;
use MinhaCidade\Community\Models\Friendship;
use Illuminate\Support\Facades\Auth;

class FriendshipButton extends Component
{
    public User $user;

    public string $status = 'none';

    public function mount(User $user): void
    {
        $this->user = $user;
        $this->refreshStatus();
    }

    protected function refreshStatus(): void
    {
        if (! Auth::check()) {
            $this->status = 'none';
            return;
        }

        $authId = Auth::id();

        $friendship = Friendship::where(function ($q) use ($authId) {
            $q->where('user_id', $authId)->where('friend_id', $this->user->id);
        })->orWhere(function ($q) use ($authId) {
            $q->where('user_id', $this->user->id)->where('friend_id', $authId);
        })->first();

        if (! $friendship) {
            $this->status = 'none';
        } elseif ($friendship->status === 'accepted') {
            $this->status = 'friends';
        } elseif ($friendship->user_id === $authId) {
            $this->status = 'pending_sent';
        } else {
            $this->status = 'pending_received';
        }
    }

    public function sendRequest(): void
    {
        if (! Auth::check()) {
            $this->dispatch('open-modal', 'login');
            return;
        }

        Friendship::create([
            'user_id'   => Auth::id(),
            'friend_id' => $this->user->id,
            'status'    => 'pending',
        ]);

        $this->status = 'pending_sent';
    }

    public function cancelRequest(): void
    {
        Friendship::where('user_id', Auth::id())
            ->where('friend_id', $this->user->id)
            ->where('status', 'pending')
            ->delete();

        $this->status = 'none';
    }

    public function acceptRequest(): void
    {
        Friendship::where('user_id', $this->user->id)
            ->where('friend_id', Auth::id())
            ->where('status', 'pending')
            ->update(['status' => 'accepted']);

        $this->status = 'friends';
    }

    public function unfriend(): void
    {
        $authId = Auth::id();
        Friendship::where(function ($q) use ($authId) {
            $q->where('user_id', $authId)->where('friend_id', $this->user->id);
        })->orWhere(function ($q) use ($authId) {
            $q->where('user_id', $this->user->id)->where('friend_id', $authId);
        })->delete();

        $this->status = 'none';
    }

    public function render()
    {
        return view('livewire.friendship-button');
    }
}
