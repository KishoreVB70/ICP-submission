import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

/**
 * This type represents a message that can be listed on a board.
 */

type Message = Record<{
    id: string;
    title: string;
    body: string;
    attachmentURL: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

// input
// Payload that will be accepted by the canister
type MessagePayload = Record<{
    title: string;
    body: string;
    attachmentURL: string;
}>

// Storage
const messageStorage = new StableBTreeMap<string, Message>(0, 44, 1024); 
// Storage slot, Key size, each message size
// Key is the uuid


// View function to see the messages
// Vec is an array structure
// String will be the error message if any occured
$query;
export function getMessages(): Result<Vec<Message>, string> {
    return Result.Ok(messageStorage.values());
}

// Get a specific message usign the unique identifier
$query;
export function getMessage(id: string): Result<Message, string> {
    // Match does pattern matching
    return match(messageStorage.get(id), {
        // If that id exists, this function is triggered
        Some: (message) => Result.Ok<Message, string>(message),
        // If that doesn't exist, this function is triggered
        None: () => Result.Err<Message, string>(`a message with id=${id} not found`)
    });
}

// Write function -> add a new message
$update;
export function addMessage(payload: MessagePayload): Result<Message, string> {
    // Create a new message
    const message: Message = { id: uuidv4(), created_at: ic.time(), updated_at: Opt.None, ...payload };
    // Add the message to the storage
    messageStorage.insert(message.id, message);
    // Return the message itself
    return Result.Ok(message);
}

// Change the existing message
$update;
export function updateMessage(id: string, payload: MessagePayload): Result<Message, string> {
    // Repeat the stuff of get message -> Maybe I can use that function here to get the message
    return match(messageStorage.get(id), {
        Some: (message) => {
            // Create a new message
            const updatedMessage: Message = {...message, ...payload, updatedAt: Opt.Some(ic.time())};
            // Insert that in th eplace of the old one
            messageStorage.insert(message.id, updatedMessage);
            return Result.Ok<Message, string>(updatedMessage);
        },
        None: () => Result.Err<Message, string>(`couldn't update a message with id=${id}. message not found`)
    });
}

// Delete function
$update;
export function deleteMessage(id: string): Result<Message, string> {\
    // Remove
    return match(messageStorage.remove(id), {
        Some: (deletedMessage) => Result.Ok<Message, string>(deletedMessage),
        None: () => Result.Err<Message, string>(`couldn't delete a message with id=${id}. message not found.`)
    });
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    getRandomValues: () => {
        let array = new Uint8Array(32)

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256)
        }

        return array
    }
}
