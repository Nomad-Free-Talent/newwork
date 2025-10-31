fn main() {
    let password = "password123";
    let hash = bcrypt::hash(password, bcrypt::DEFAULT_COST).unwrap();
    println!("{}", hash);
}

