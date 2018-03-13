
module.exports = function determinTokensToMint(conf) {
    let totalTokens = 0
    for (const recipient in conf.rewardees) {
      totalTokens = totalTokens + parseInt(conf.rewardees[recipient].amount, 10)
    }
    return totalTokens
  }