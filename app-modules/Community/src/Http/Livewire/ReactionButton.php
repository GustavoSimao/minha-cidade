<?php

declare(strict_types=1);

namespace MinhaCidade\Community\Http\Livewire;

use Livewire\Component;
use MinhaCidade\Publication\Models\Publication;
use MinhaCidade\Community\Models\Reaction;
use Illuminate\Support\Facades\Auth;

class ReactionButton extends Component
{
    public Publication $publication;

    public ?string $userReaction = null;
    public int $supportCount = 0;
    public int $opposeCount  = 0;

    public function mount(Publication $publication): void
    {
        $this->publication = $publication;
        $this->supportCount = $publication->reactions()->where('type', 'support')->count();
        $this->opposeCount  = $publication->reactions()->where('type', 'oppose')->count();

        if (Auth::check()) {
            $existing = $publication->reactions()->where('user_id', Auth::id())->first();
            $this->userReaction = $existing?->type;
        }
    }

    public function react(string $type): void
    {
        if (! Auth::check()) {
            $this->dispatch('open-modal', 'login');
            return;
        }

        $reaction = $this->publication->reactions()->where('user_id', Auth::id())->first();

        if ($reaction) {
            if ($reaction->type === $type) {
                $reaction->delete();
                $this->userReaction = null;
            } else {
                $reaction->update(['type' => $type]);
                $this->userReaction = $type;
            }
        } else {
            $this->publication->reactions()->create([
                'user_id' => Auth::id(),
                'type'    => $type,
            ]);
            $this->userReaction = $type;
        }

        $this->supportCount = $this->publication->reactions()->where('type', 'support')->count();
        $this->opposeCount  = $this->publication->reactions()->where('type', 'oppose')->count();
    }

    public function render()
    {
        return view('livewire.reaction-button');
    }
}
