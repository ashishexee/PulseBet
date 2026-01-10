use bingo::GameRoom;
use linera_sdk::views::{RegisterView, RootView, ViewStorageContext};

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct BingoState {
    pub room: RegisterView<Option<GameRoom>>,
}
